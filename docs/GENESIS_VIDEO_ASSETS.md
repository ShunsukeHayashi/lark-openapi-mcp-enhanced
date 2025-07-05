# Genesis Video Tutorial - Production Assets

This document contains all the production assets, code snippets, and visual elements needed to create the Genesis AI system video tutorial.

## 🎬 Ready-to-Use Code Snippets

### Installation & Setup Commands
```bash
# Clone and install
git clone https://github.com/larksuite/lark-openapi-mcp-enhanced
cd lark-openapi-mcp-enhanced
yarn install
yarn build

# Quick test
node dist/cli.js mcp --mode stdio --tools preset.genesis.default
```

### Environment Configuration
```bash
# .env file setup
export APP_ID="cli_your_app_id_here"
export APP_SECRET="your_app_secret_here"
export GEMINI_API_KEY="your_gemini_api_key_here"
export LARK_DOMAIN="https://open.larksuite.com"
export NODE_ENV="production"
```

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "lark-genesis": {
      "command": "npx",
      "args": [
        "-y", 
        "@larksuiteoapi/lark-mcp@0.4.0",
        "mcp",
        "--mode", "stdio",
        "--tools", "preset.genesis.default"
      ],
      "env": {
        "APP_ID": "cli_your_app_id",
        "APP_SECRET": "your_app_secret",
        "GEMINI_API_KEY": "your_gemini_key"
      }
    }
  }
}
```

## 📝 Demo Scenarios & Scripts

### Scenario 1: CRM System Creation
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "genesis.builtin.create_base",
    "arguments": {
      "requirements": "Create a comprehensive customer relationship management system for a growing sales team. Include customer contact information, lead tracking with status pipeline, sales opportunities with deal values, communication history, task management, and automated follow-up reminders. Add reporting capabilities for sales performance and pipeline analysis.",
      "template_type": "crm",
      "include_sample_data": true
    }
  },
  "id": 1
}
```

**Expected Visual Result**:
```
✅ CRM Base Created Successfully!

📊 Generated Structure:
┌─────────────────────────────────────────┐
│ 🏢 Customers Table (15 fields)         │
│   • Contact Info (name, email, phone)  │
│   • Company Details (size, industry)   │
│   • Status & Priority                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 💰 Opportunities Table (12 fields)     │
│   • Deal Value & Stage                 │
│   • Probability & Close Date           │
│   • Assigned Sales Rep                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📞 Activities Table (10 fields)        │
│   • Communication History              │
│   • Task Management                    │
│   • Follow-up Scheduling               │
└─────────────────────────────────────────┘

🔗 Base URL: https://base.larksuite.com/app/abc123
📈 Dashboard: Sales Pipeline & Performance Reports
⚡ Automations: 3 workflows configured
```

### Scenario 2: Project Management System
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "genesis.builtin.create_base",
    "arguments": {
      "requirements": "Development team needs a project management system for agile software development. Include epic and story management, sprint planning, task tracking with time estimates, bug tracking, team member assignments, burndown charts, and integration with development workflows.",
      "template_type": "project_management",
      "customizations": {
        "methodology": "scrum",
        "team_size": "8-12",
        "sprint_length": "2_weeks"
      }
    }
  },
  "id": 2
}
```

### Scenario 3: Event Management System
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "genesis.builtin.create_base",
    "arguments": {
      "requirements": "Organize a tech conference with 500+ attendees. Need speaker management with session scheduling, attendee registration and tracking, venue coordination, sponsor management, budget tracking, feedback collection, and post-event analytics. Include automated email notifications and QR code check-ins.",
      "template_type": "event_management",
      "event_details": {
        "type": "conference",
        "capacity": 500,
        "duration": "2_days",
        "tracks": 3
      }
    }
  },
  "id": 3
}
```

## 🎨 Visual Design Elements

### Terminal Styling
```css
/* Terminal appearance for screen recording */
.terminal {
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 20px;
  border-radius: 8px;
}

.prompt {
  color: #569cd6;
  font-weight: bold;
}

.command {
  color: #9cdcfe;
}

.output-success {
  color: #4ec9b0;
}

.output-error {
  color: #f44747;
}
```

### Progress Indicators
```
⏳ Analyzing requirements...
🔍 Identifying entities and relationships...
📊 Designing table structure...
🔧 Creating Lark Base application...
✅ Genesis creation completed!

[████████████████████████████████] 100%
```

### Status Badges
```
🟢 CONNECTED    🔄 PROCESSING    ✅ COMPLETED
🟡 PENDING      ⚠️ WARNING       ❌ ERROR
🔵 INFO         📊 ANALYTICS     🚀 READY
```

## 📱 Screenshot Requirements

### 1. Before/After Comparison
**Before (Manual Setup)**:
- Multiple Lark Base configuration screens
- Complex table creation forms
- Field-by-field manual entry
- Relationship configuration dialogs

**After (Genesis Creation)**:
- Single command execution
- Instant complete base creation
- All relationships configured
- Ready-to-use interface

### 2. Template Gallery
```
┌─────────────┬─────────────┬─────────────┐
│     CRM     │ Project Mgmt│     HR      │
│  👥📊💼     │   📋⚡🔄    │  👤📊📋    │
│ Sales & Lead│ Agile & Task│ Employee &  │
│ Management  │ Tracking    │ Performance │
└─────────────┴─────────────┴─────────────┘

┌─────────────┬─────────────┬─────────────┐
│ Event Mgmt  │  Inventory  │   Custom    │
│  🎪📅🎫    │   📦📊📋   │   🔧⚙️🎯   │
│ Conference &│ Warehouse & │ Build Your  │
│ Registration│ Stock Mgmt  │ Own System  │
└─────────────┴─────────────┴─────────────┘
```

### 3. Real-time Creation Process
- Genesis analysis screen
- API calls in progress
- Lark Base being created
- Tables appearing sequentially
- Relationships being established
- Views and dashboards generation

### 4. Feature Highlights
```
🧠 AI-Powered Analysis
├── Natural language processing
├── Entity relationship detection
├── Business logic understanding
└── Optimization recommendations

🔧 Automated Generation
├── Table structure creation
├── Field type optimization
├── View configuration
├── Dashboard assembly
└── Automation setup

⚡ Real-time Integration
├── Live Lark API calls
├── Instant base creation
├── Immediate accessibility
└── Production-ready output
```

## 🎵 Audio Elements

### Background Music Requirements
- **Intro**: Upbeat, tech-forward (30 seconds)
- **Demo Sections**: Subtle, non-distracting ambient
- **Success Moments**: Brief positive audio cues
- **Outro**: Memorable, call-to-action friendly

### Sound Effects
- **Typing**: Mechanical keyboard sounds for code entry
- **Success**: Subtle "ding" for completed operations
- **Transitions**: Soft "whoosh" between sections
- **Notifications**: Lark-style notification sounds

### Voice-over Guidelines
- **Tone**: Professional but approachable
- **Pace**: Moderate, allowing for code reading
- **Emphasis**: Key benefits and features
- **Pauses**: Strategic pauses during code execution

## 📊 Analytics & Metrics Integration

### Video Chapters for Platform Upload
```
00:00 - Introduction & Hook
01:30 - Genesis System Overview  
03:00 - Quick Start Demo
05:30 - Advanced Template Usage
07:30 - Real-World Business Scenario
10:00 - Advanced Features Deep Dive
12:00 - Integration & Production
13:30 - Tips, Tricks & Troubleshooting
14:30 - Resources & Next Steps
```

### Clickable Elements (YouTube Cards)
- **03:15**: Link to Genesis documentation
- **05:45**: Link to template gallery
- **08:30**: Link to GitHub repository
- **12:30**: Link to Claude Desktop setup guide
- **14:45**: Subscribe prompt and related videos

### Call-to-Action Text Overlays
```
💡 Try This: Copy the command below
🔗 Documentation: github.com/larksuite/lark-openapi-mcp
📚 More Templates: /docs/GENESIS_TEMPLATES.md
🚀 Get Started: Install Genesis in 2 minutes
💬 Questions? Join our Discord community
```

## 🔧 Technical Setup

### Recording Environment
```bash
# Terminal setup for recording
export PS1="\[\033[01;32m\]\u@genesis\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ "
clear
echo "🚀 Genesis AI System Demo Environment Ready"
echo "==================================="
```

### Screen Resolution & Layout
- **Primary**: 1920x1080 full screen
- **Terminal**: 80% of screen width
- **Browser**: Side-by-side with terminal when needed
- **IDE**: Full screen for code walkthroughs

### Testing Checklist Before Recording
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Lark API credentials valid
- [ ] Gemini AI API accessible
- [ ] Network connection stable
- [ ] Audio levels tested
- [ ] Screen recording software configured
- [ ] Backup scenarios prepared

This comprehensive asset collection ensures professional video production with all necessary elements for an engaging, informative Genesis AI tutorial.