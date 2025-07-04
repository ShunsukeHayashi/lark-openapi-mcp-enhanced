
graph TD
    Tasks[Tasks Table]
    Team[Team Members]
    Projects[Projects Table]
    Comments[Comments Table]
    
    Tasks -->|Assignee| Team
    Tasks -->|Project| Projects
    Comments -->|Task ID| Tasks
    Comments -->|Author| Team
    Projects -->|Lead| Team
    
    style Tasks fill:#f9f,stroke:#333,stroke-width:4px
    style Team fill:#9ff,stroke:#333,stroke-width:2px
    style Projects fill:#ff9,stroke:#333,stroke-width:2px
    style Comments fill:#9f9,stroke:#333,stroke-width:2px
