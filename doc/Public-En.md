# JSON Format

http://jsonviewer.stack.hu/ is good.

## Structure

    { ... List
        tasks: [
            { ... Task
                actions: [
                    { ... Action
                        action: 'create-task' ... Action Code
                    }
                ]
            }
        ],
        users: [
            { ... User
                code: 'tw-XXXXX' ... User Code
            }
        ],
        members: [
            'tw-XXXXX', ... User Code
            'tw-XXXXX',
        ]
    }

## List

    id ... List ID
    name ... List Name
    owner ... List Owner (Format: **User Code**)
    members ... List Member (Format: User Code's Array)
    tasks ... Task (See Task Section)
    users ... User (See User Section）
    public_code ... Part of the public url
    last_task_id ... Last Task ID
    actioned_on ... Last Modified Time（Format:millisecond epoch time）

## User

    icon ... User Icon URL
    name ... User Name
    code ... **User Code**

## Task

    id ... Task ID
    name ... Task Name
    status ... 0: Open, 1: In Progress, 2: Fixed
    closed ... 0: Not Closed, 1: Closed
    registrant ... Registrant (Format: **User Code**)
    assign ... Assign (Format: **User Code**)
    actions ... Action (See Action Section)
    due ... Due of date (Format:MM/DD/YYYY)
    created_on ... Created Time （Format:millisecond epoch time）
    updated_on ... Updated Time （Format:millisecond epoch time）

## Action

    id ... Action ID
    code ... Action by User (Format: **User Code**)
    action ... Action (See Action Code Section)
    message ... Message
    time ... Action Time （Format:millisecond epoch time）

## Action Code

    create-task    ... Create a Task
    update-task    ... Update a Task
    reopen-task    ... Update a Task (Fixed to Open)
    start-task     ... Start a Task
    fix-task       ... Fixed a Task
    close-task     ... Closed a Task
    rereopen-task  ... Update a Task (Closed to Open)
    restart-task   ... Update a Task (Fixed to In Progress)
    refix-task     ... Update a Task (Closed to Fixed)
    comment        ... Comment