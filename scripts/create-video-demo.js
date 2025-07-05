#!/usr/bin/env node

/**
 * Genesis Video Demo Generator
 * Creates realistic demo scenarios for video production
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Genesis Video Demo Generator');
console.log('===============================\n');

// Demo scenarios for video
const demoScenarios = {
  crm: {
    title: "Customer Relationship Management System",
    description: "Complete CRM with lead tracking, sales pipeline, and customer management",
    requirements: `Create a comprehensive customer relationship management system for a growing sales team. 

Key Requirements:
• Customer contact information (name, email, phone, company)
• Lead tracking with status pipeline (lead → prospect → opportunity → customer)  
• Sales opportunities with deal values, probability, and close dates
• Communication history (calls, emails, meetings, notes)
• Task management and follow-up reminders
• Team assignments and territory management
• Reporting capabilities for sales performance and pipeline analysis
• Integration with email and calendar systems

The system should support a team of 10-15 sales representatives managing 500+ customers and 200+ active opportunities.`,
    
    expectedTables: [
      {
        name: "Customers",
        fields: ["Name", "Email", "Phone", "Company", "Industry", "Size", "Status", "Source", "Owner", "Created Date"],
        recordCount: "500+"
      },
      {
        name: "Opportunities", 
        fields: ["Title", "Customer", "Value", "Stage", "Probability", "Close Date", "Owner", "Source", "Notes"],
        recordCount: "200+"
      },
      {
        name: "Activities",
        fields: ["Type", "Subject", "Customer", "Opportunity", "Date", "Owner", "Status", "Follow-up", "Notes"],
        recordCount: "1000+"
      },
      {
        name: "Tasks",
        fields: ["Title", "Description", "Priority", "Due Date", "Assigned To", "Status", "Related Record"],
        recordCount: "300+"
      }
    ],
    
    views: [
      "Sales Pipeline Dashboard",
      "My Opportunities", 
      "Hot Leads",
      "Overdue Tasks",
      "Performance Reports"
    ],
    
    automations: [
      "New lead notification",
      "Follow-up reminder",
      "Deal closing alert",
      "Weekly pipeline report"
    ]
  },
  
  project: {
    title: "Agile Project Management System",
    description: "Complete project management with sprints, tasks, and team collaboration",
    requirements: `Development team needs a comprehensive project management system for agile software development.

Key Requirements:
• Epic and user story management with acceptance criteria
• Sprint planning and backlog management (2-week sprints)
• Task tracking with time estimates, actual time, and remaining work
• Bug tracking with severity, priority, and resolution tracking
• Team member assignments and capacity planning
• Burndown charts and velocity tracking
• Code repository integration and deployment tracking
• Daily standup and retrospective support

The system should support 2-3 development teams (8-12 people total) working on multiple projects simultaneously.`,
    
    expectedTables: [
      {
        name: "Epics",
        fields: ["Title", "Description", "Priority", "Status", "Owner", "Start Date", "Target Date", "Progress"],
        recordCount: "20+"
      },
      {
        name: "Stories",
        fields: ["Title", "Epic", "Description", "Acceptance Criteria", "Story Points", "Priority", "Status", "Assignee"],
        recordCount: "150+"
      },
      {
        name: "Tasks", 
        fields: ["Title", "Story", "Description", "Estimate", "Actual Time", "Remaining", "Assignee", "Status"],
        recordCount: "500+"
      },
      {
        name: "Sprints",
        fields: ["Name", "Start Date", "End Date", "Goal", "Capacity", "Velocity", "Status", "Team"],
        recordCount: "50+"
      },
      {
        name: "Bugs",
        fields: ["Title", "Description", "Severity", "Priority", "Reporter", "Assignee", "Status", "Resolution"],
        recordCount: "100+"
      }
    ],
    
    views: [
      "Sprint Board", 
      "Product Backlog",
      "My Tasks",
      "Bug Tracker",
      "Burndown Chart",
      "Team Velocity"
    ],
    
    automations: [
      "Sprint start notification",
      "Task overdue alert", 
      "Bug assignment",
      "Daily standup reminder"
    ]
  },
  
  event: {
    title: "Tech Conference Management System",
    description: "Complete event management with speakers, attendees, and logistics",
    requirements: `Organize a 2-day tech conference with 500+ attendees, multiple tracks, and comprehensive logistics management.

Key Requirements:
• Speaker management with session scheduling and requirements
• Attendee registration with ticketing and check-in process
• Session management with tracks, rooms, and time slots
• Venue coordination with room setup and equipment needs
• Sponsor management with packages and deliverables
• Budget tracking with income and expense categories
• Feedback collection from attendees and speakers
• Post-event analytics and reporting
• Automated email notifications and QR code check-ins
• Mobile app integration for schedule and networking

Event Details: 500 attendees, 50 speakers, 60 sessions, 8 sponsors, $250K budget.`,
    
    expectedTables: [
      {
        name: "Speakers",
        fields: ["Name", "Email", "Company", "Bio", "Photo", "Sessions", "Requirements", "Travel", "Status"],
        recordCount: "50+"
      },
      {
        name: "Attendees",
        fields: ["Name", "Email", "Company", "Title", "Ticket Type", "Registration Date", "Check-in", "Sessions"],
        recordCount: "500+"
      },
      {
        name: "Sessions",
        fields: ["Title", "Speaker", "Track", "Room", "Date", "Time", "Duration", "Capacity", "Registrations"],
        recordCount: "60+"
      },
      {
        name: "Sponsors",
        fields: ["Company", "Package", "Contact", "Logo", "Deliverables", "Payment", "Status", "Booth"],
        recordCount: "8+"
      },
      {
        name: "Budget",
        fields: ["Category", "Item", "Type", "Amount", "Date", "Status", "Sponsor", "Notes"],
        recordCount: "200+"
      }
    ],
    
    views: [
      "Event Schedule",
      "Speaker Dashboard", 
      "Registration Overview",
      "Sponsor Deliverables",
      "Budget Summary",
      "Feedback Reports"
    ],
    
    automations: [
      "Registration confirmation",
      "Session reminder", 
      "Speaker communication",
      "Check-in notification"
    ]
  }
};

// Generate demo commands
function generateDemoCommands() {
  console.log('📝 Generating Video Demo Commands...\n');
  
  const demoCommands = [];
  
  for (const [key, scenario] of Object.entries(demoScenarios)) {
    const command = {
      scenario: key,
      title: scenario.title,
      description: scenario.description,
      genesis_command: {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "genesis.builtin.create_base",
          arguments: {
            requirements: scenario.requirements,
            template_type: key === 'project' ? 'project_management' : key,
            include_sample_data: true,
            optimization_level: "high"
          }
        },
        id: demoCommands.length + 1
      },
      expected_output: {
        tables: scenario.expectedTables,
        views: scenario.views,
        automations: scenario.automations,
        estimated_creation_time: "2-3 minutes",
        complexity_score: "High"
      }
    };
    
    demoCommands.push(command);
  }
  
  return demoCommands;
}

// Generate analysis commands for advanced demo
function generateAnalysisCommands() {
  return [
    {
      title: "Requirement Analysis Demo",
      command: {
        jsonrpc: "2.0",
        method: "tools/call", 
        params: {
          name: "genesis.builtin.analyze_requirements",
          arguments: {
            requirements: "I need a system to manage our startup's hiring process, from job posting to onboarding"
          }
        },
        id: 10
      }
    },
    {
      title: "ER Diagram Generation",
      command: {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "genesis.builtin.generate_er_diagram", 
          arguments: {
            base_token: "generated_base_token",
            include_relationships: true,
            include_field_types: true
          }
        },
        id: 11
      }
    },
    {
      title: "Base Optimization",
      command: {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "genesis.builtin.optimize_base",
          arguments: {
            base_token: "generated_base_token", 
            optimization_type: "performance",
            target_metrics: ["query_speed", "storage_efficiency"]
          }
        },
        id: 12
      }
    }
  ];
}

// Generate setup commands
function generateSetupCommands() {
  return [
    {
      title: "Environment Setup",
      commands: [
        "# Install dependencies",
        "yarn install",
        "",
        "# Build the project", 
        "yarn build",
        "",
        "# Configure environment",
        "export APP_ID=\"cli_your_app_id\"",
        "export APP_SECRET=\"your_app_secret\"", 
        "export GEMINI_API_KEY=\"your_gemini_key\"",
        "",
        "# Start Genesis system",
        "node dist/cli.js mcp --mode stdio --tools preset.genesis.default"
      ]
    },
    {
      title: "Claude Desktop Configuration",
      config: {
        mcpServers: {
          "lark-genesis": {
            command: "npx",
            args: [
              "-y",
              "@larksuiteoapi/lark-mcp@0.4.0", 
              "mcp",
              "--mode", "stdio",
              "--tools", "preset.genesis.default"
            ],
            env: {
              APP_ID: "cli_your_app_id",
              APP_SECRET: "your_app_secret",
              GEMINI_API_KEY: "your_gemini_key"
            }
          }
        }
      }
    }
  ];
}

// Create video demo assets
function createVideoDemoAssets() {
  const demoData = {
    scenarios: demoScenarios,
    commands: {
      demo: generateDemoCommands(),
      analysis: generateAnalysisCommands(),
      setup: generateSetupCommands()
    },
    metadata: {
      created: new Date().toISOString(),
      version: "1.0.0",
      purpose: "Genesis AI Video Tutorial Production"
    }
  };
  
  // Create output directory
  const outputDir = path.join(__dirname, '..', 'video-assets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Write demo scenarios file
  fs.writeFileSync(
    path.join(outputDir, 'demo-scenarios.json'),
    JSON.stringify(demoData, null, 2)
  );
  
  // Write individual command files for easy copy-paste
  demoData.commands.demo.forEach((demo, index) => {
    fs.writeFileSync(
      path.join(outputDir, `demo-${demo.scenario}-command.json`),
      JSON.stringify(demo.genesis_command, null, 2)
    );
  });
  
  console.log('✅ Video demo assets created in /video-assets/');
  console.log(`   • demo-scenarios.json (complete scenarios)`);
  console.log(`   • demo-*-command.json (individual commands)`);
  
  return outputDir;
}

// Generate production checklist
function generateProductionChecklist() {
  const checklist = {
    "Pre-Recording Setup": [
      "✓ Install and configure Genesis system",
      "✓ Set up environment variables", 
      "✓ Test all demo commands",
      "✓ Prepare clean terminal environment",
      "✓ Configure screen recording software",
      "✓ Set up proper lighting and audio"
    ],
    "Recording Environment": [
      "✓ Close unnecessary applications",
      "✓ Clear browser history and bookmarks",
      "✓ Set terminal to proper font size",
      "✓ Configure proper screen resolution (1920x1080)",
      "✓ Test audio levels and background noise",
      "✓ Prepare backup scenarios"
    ],
    "Content Flow": [
      "✓ Introduction and hook (90 seconds)",
      "✓ System overview and capabilities",
      "✓ CRM demo scenario (detailed walkthrough)",
      "✓ Quick template demonstrations", 
      "✓ Advanced features showcase",
      "✓ Production setup and integration",
      "✓ Tips and troubleshooting",
      "✓ Call to action and resources"
    ],
    "Post-Production": [
      "✓ Add captions and subtitles",
      "✓ Include chapter markers",
      "✓ Create engaging thumbnail",
      "✓ Write detailed description with links",
      "✓ Prepare downloadable assets",
      "✓ Export multiple quality versions"
    ]
  };
  
  return checklist;
}

// Main execution
function main() {
  console.log('🚀 Generating Genesis Video Tutorial Assets...\n');
  
  const outputDir = createVideoDemoAssets();
  const checklist = generateProductionChecklist();
  
  // Write production checklist
  fs.writeFileSync(
    path.join(outputDir, 'production-checklist.json'),
    JSON.stringify(checklist, null, 2)
  );
  
  console.log('\n📋 Production Checklist:');
  Object.entries(checklist).forEach(([section, items]) => {
    console.log(`\n${section}:`);
    items.forEach(item => console.log(`  ${item}`));
  });
  
  console.log('\n🎬 Ready for Video Production!');
  console.log('================================');
  console.log(`📁 Assets: ${outputDir}`);
  console.log('📚 Script: docs/GENESIS_VIDEO_TUTORIAL.md');
  console.log('🎨 Visuals: docs/GENESIS_VIDEO_ASSETS.md');
  console.log('\n💡 Next Steps:');
  console.log('   1. Review all demo scenarios');
  console.log('   2. Test commands in clean environment');
  console.log('   3. Set up recording environment');
  console.log('   4. Record demo segments');
  console.log('   5. Edit and publish video');
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  generateDemoCommands,
  generateAnalysisCommands,
  generateSetupCommands,
  createVideoDemoAssets,
  generateProductionChecklist
};