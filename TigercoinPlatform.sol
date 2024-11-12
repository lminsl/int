// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TigercoinPlatform is Ownable {
    IERC20 public tigercoin;
    uint256 public minimumStake = 50 * 10**18;
    uint256 public baseRewardPercent = 5;       // 5% for answering
    uint256 public correctBonusPercent = 20;    // Additional 20% if answer is correct
    uint256 public validatorRewardPercent = 60; // 60% of the question stake for correct votes
    uint256 public validatorPenaltyPercent = 50; // 50% penalty for incorrect validators
    uint256 public minimumVotes = 3;
    uint256 public votingWindow = 2 days;

    struct Validator {
        uint256 stakedAmount;
        bool isValidator;
    }

    struct Answer {
        address payable expert;
        uint256 rewardEscrow;
        uint256 weightedCorrectVotes;
        uint256 weightedIncorrectVotes;
        uint256 timestamp;
        uint256 validatorVotes;
        bool finalized;
        mapping(address => bool) voted;
        mapping(address => bool) voteResult;
        address[] validatorList;
    }

    mapping(address => Validator) public validators;
    mapping(uint256 => Answer) public answers;
    mapping(uint256 => uint256) public questionStake; // Tracks the amount staked per question
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event Staked(address indexed validator, uint256 amount);
    event Unstaked(address indexed validator, uint256 amount);
    event VoteCasted(address indexed validator, uint256 answerId, bool isCorrect, uint256 weight);
    event AnswerFinalized(uint256 answerId, bool accepted, uint256 reward);
    event ValidatorRewarded(address validator, uint256 reward);
    event ValidatorPenalized(address validator, uint256 penalty);

    constructor(address _tigercoinAddress) Ownable(msg.sender) {
        tigercoin = IERC20(_tigercoinAddress);
    }

    function stakeTokens(uint256 amount) external {
        require(amount >= minimumStake, "Amount below minimum stake");
        require(tigercoin.transferFrom(msg.sender, address(this), amount), "Stake transfer failed");

        validators[msg.sender].stakedAmount += amount;
        validators[msg.sender].isValidator = true;

        emit Staked(msg.sender, amount);
    }

    function unstakeTokens(uint256 amount) external {
        Validator storage validator = validators[msg.sender];
        require(validator.isValidator, "Not a validator");
        require(validator.stakedAmount >= amount, "Insufficient staked amount");

        validator.stakedAmount -= amount;
        if (validator.stakedAmount < minimumStake) {
            validator.isValidator = false;
        }

        require(tigercoin.transfer(msg.sender, amount), "Unstake transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    function postAnswer(uint256 questionId) external {
        require(answers[questionId].expert == address(0), "Answer already exists");

        // Set initial reward escrow to 5% of the question stake
        uint256 rewardEscrow = (questionStake[questionId] * baseRewardPercent) / 100;

        Answer storage answer = answers[questionId]; // Access the storage reference for the answer
        answer.expert = payable(msg.sender);
        answer.rewardEscrow = rewardEscrow;
        answer.weightedCorrectVotes = 0;
        answer.weightedIncorrectVotes = 0;
        answer.timestamp = block.timestamp;
        answer.validatorVotes = 0;
        answer.finalized = false;
    }


    function voteOnAnswer(uint256 answerId, bool isCorrect) external {
        Validator storage validator = validators[msg.sender];
        require(validator.isValidator, "Not a validator");
        Answer storage answer = answers[answerId];
        require(!answer.finalized, "Answer already finalized");
        require(!answer.voted[msg.sender], "Validator has already voted");
        require(!hasVoted[answerId][msg.sender], "You have already voted on this answer.");

        uint256 voteWeight = validator.stakedAmount;
        answer.validatorVotes += 1;
        answer.voted[msg.sender] = true;
        answer.voteResult[msg.sender] = isCorrect;
        answer.validatorList.push(msg.sender);

        if (isCorrect) {
            answer.weightedCorrectVotes += voteWeight;
        } else {
            answer.weightedIncorrectVotes += voteWeight;
        }

        emit VoteCasted(msg.sender, answerId, isCorrect, voteWeight);

        if (answer.validatorVotes >= minimumVotes || (block.timestamp >= answer.timestamp + votingWindow)) {
            finalizeAnswer(answerId);
        }
    }

    function finalizeAnswer(uint256 answerId) internal {
        Answer storage answer = answers[answerId];
        require(!answer.finalized, "Answer already finalized");

        answer.finalized = true;
        bool accepted = answer.weightedCorrectVotes > answer.weightedIncorrectVotes;
        uint256 finalReward = answer.rewardEscrow;

        if (accepted) {
            uint256 additionalReward = (questionStake[answerId] * correctBonusPercent) / 100;
            finalReward += additionalReward;

            require(tigercoin.transfer(answer.expert, finalReward), "Reward transfer failed");

            rewardOrPenalizeValidators(answerId, true);
        } else {
            uint256 penaltyAmount = finalReward / 2;
            answer.rewardEscrow -= penaltyAmount;
            require(tigercoin.transferFrom(answer.expert, address(this), penaltyAmount), "Expert penalty transfer failed");

            rewardOrPenalizeValidators(answerId, false);
        }

        emit AnswerFinalized(answerId, accepted, finalReward);
    }

    function rewardOrPenalizeValidators(uint256 answerId, bool rewardCorrect) internal {
        Answer storage answer = answers[answerId];
        uint256 questionTotalStake = questionStake[answerId];
        uint256 validatorRewardPool = 0;

        for (uint256 i = 0; i < answer.validatorList.length; i++) {
            address validator = answer.validatorList[i];
            Validator storage validatorInfo = validators[validator];
            uint256 validatorStake = validatorInfo.stakedAmount;

            if (answer.voteResult[validator] == rewardCorrect) {
                validatorRewardPool += validatorStake;
            } else {
                uint256 penalty = (validatorStake * validatorPenaltyPercent) / 100;
                validatorInfo.stakedAmount -= penalty;
                questionTotalStake += penalty;
                emit ValidatorPenalized(validator, penalty);
            }
        }

        uint256 rewardForCorrectValidators = (questionTotalStake * validatorRewardPercent) / 100;

        for (uint256 i = 0; i < answer.validatorList.length; i++) {
            address validator = answer.validatorList[i];
            Validator storage validatorInfo = validators[validator];
            uint256 validatorStake = validatorInfo.stakedAmount;

            if (answer.voteResult[validator] == rewardCorrect) {
                uint256 validatorShare = (validatorStake * rewardForCorrectValidators) / validatorRewardPool;
                require(tigercoin.transfer(validator, validatorShare), "Validator reward transfer failed");
                emit ValidatorRewarded(validator, validatorShare);
            }
        }
    }
}
