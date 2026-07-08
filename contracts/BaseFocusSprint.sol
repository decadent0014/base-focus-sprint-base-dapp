// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseFocusSprint {
    uint256 public nextSprintId = 1;

    struct FocusSprint {
        address author;
        string task;
        uint256 durationMinutes;
        string note;
        uint256 createdAt;
    }

    mapping(uint256 => FocusSprint) private sprints;

    event SprintLogged(
        uint256 indexed sprintId,
        address indexed author,
        string task,
        uint256 durationMinutes,
        string note
    );

    function logSprint(
        string calldata task,
        uint256 durationMinutes,
        string calldata note
    ) external returns (uint256 sprintId) {
        require(bytes(task).length > 0 && bytes(task).length <= 56, "Invalid task");
        require(durationMinutes >= 5 && durationMinutes <= 180, "Invalid minutes");
        require(bytes(note).length > 0 && bytes(note).length <= 180, "Invalid note");

        sprintId = nextSprintId++;
        sprints[sprintId] = FocusSprint({
            author: msg.sender,
            task: task,
            durationMinutes: durationMinutes,
            note: note,
            createdAt: block.timestamp
        });

        emit SprintLogged(sprintId, msg.sender, task, durationMinutes, note);
    }

    function getSprint(
        uint256 sprintId
    )
        external
        view
        returns (
            address author,
            string memory task,
            uint256 durationMinutes,
            string memory note,
            uint256 createdAt
        )
    {
        FocusSprint storage sprint = sprints[sprintId];
        return (
            sprint.author,
            sprint.task,
            sprint.durationMinutes,
            sprint.note,
            sprint.createdAt
        );
    }
}
