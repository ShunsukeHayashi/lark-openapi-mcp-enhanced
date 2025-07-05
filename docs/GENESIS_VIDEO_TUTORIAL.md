# Genesis AI System - Video Tutorial Script & Storyboard

This comprehensive video tutorial script covers the Genesis AI system for creating Lark Base applications from natural language requirements. Duration: 12-15 minutes.

## 📋 Video Overview

**Title**: "Genesis AI: Transform Ideas into Lark Base Applications Instantly"
**Duration**: 12-15 minutes
**Target Audience**: Lark users, developers, business analysts
**Learning Objectives**: 
- Understand Genesis AI capabilities
- Learn to create Lark Base applications from natural language
- Master advanced Genesis features
- Implement real-world business scenarios

---

## 🎬 Storyboard & Script

### Scene 1: Introduction & Hook (0:00 - 1:30)

**Visual**: Split screen showing complex Lark Base setup vs. simple Genesis command
**Narrator**: "What if I told you that you could create complex Lark Base applications in minutes, not hours, using just natural language?"

**Screen Recording**:
```bash
# Show terminal with Genesis command
node dist/cli.js mcp --tools preset.genesis.default
```

**Visual Transition**: Show before/after comparison:
- Before: Multiple screens of manual Lark Base configuration
- After: Single Genesis command creating the same application

**Key Points**:
- Traditional Lark Base setup takes hours
- Genesis AI creates applications in minutes
- Natural language to production-ready systems
- No technical expertise required

---

### Scene 2: Genesis System Overview (1:30 - 3:00)

**Visual**: Architecture diagram animation showing:
1. Natural language input
2. AI analysis and decomposition
3. Lark Base generation
4. Real API integration

**Narrator**: "Genesis is an AI-powered system that transforms your business requirements into fully functional Lark Base applications."

**Screen Recording**: Show Genesis tools list
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Visual Elements**:
- Animated workflow diagram
- Genesis tool icons and descriptions
- Real API connection indicators
- Template gallery preview

**Key Features Highlighted**:
- 6 pre-built business templates
- Real-time API integration
- Intelligent requirement analysis
- Automatic table and view creation

---

### Scene 3: Quick Start Demo (3:00 - 5:30)

**Scenario**: "Let's create a customer relationship management system"

**Visual**: Full-screen terminal/Claude Desktop interface

**Step 1: Initialize Genesis**
```bash
# Terminal command
yarn build && node dist/cli.js mcp --mode stdio --tools preset.genesis.default
```

**Step 2: Natural Language Request**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "genesis.builtin.create_base",
    "arguments": {
      "requirements": "I need a customer relationship management system to track leads, customers, sales opportunities, and communication history. Include fields for contact information, deal value, status tracking, and automated follow-up reminders.",
      "template_type": "crm"
    }
  },
  "id": 1
}
```

**Visual Effects**:
- Typing animation for natural language input
- Real-time response showing AI analysis
- Step-by-step base creation progress
- Live Lark Base being created in background

**Expected Response Animation**:
```json
{
  "result": {
    "content": [{
      "type": "text", 
      "text": "✅ CRM Base Created Successfully!\n\n📊 Generated Structure:\n• Customers Table (12 fields)\n• Opportunities Table (10 fields)\n• Activities Table (8 fields)\n• Reports Dashboard\n\n🔗 Base URL: https://base.larksuite.com/..."
    }]
  }
}
```

---

### Scene 4: Advanced Template Usage (5:30 - 7:30)

**Scenario**: "Using pre-built templates for rapid deployment"

**Visual**: Split screen showing multiple templates

**Template Showcase**:
1. **CRM Template**
   ```json
   {
     "template_type": "crm",
     "requirements": "Sales team needs lead tracking with pipeline management"
   }
   ```

2. **Project Management Template**
   ```json
   {
     "template_type": "project_management", 
     "requirements": "Development team needs task tracking with sprint planning"
   }
   ```

3. **HR Template**
   ```json
   {
     "template_type": "hr",
     "requirements": "HR team needs employee onboarding and performance tracking"
   }
   ```

**Visual Elements**:
- Template gallery with thumbnails
- Before/after comparisons
- Feature highlights for each template
- Time-lapse creation process

**Narrator**: "Genesis includes 6 professionally designed templates that serve as starting points for common business needs."

---

### Scene 5: Real-World Business Scenario (7:30 - 10:00)

**Scenario**: "Complete business workflow: Event Management System"

**Requirements**: 
"I'm organizing a tech conference and need to manage speakers, attendees, sessions, venues, and sponsors. Include registration workflow, session scheduling, feedback collection, and financial tracking."

**Step-by-Step Process**:

**Step 1: Requirement Analysis**
```json
{
  "name": "genesis.builtin.analyze_requirements",
  "arguments": {
    "requirements": "Tech conference management with speakers, attendees, sessions, venues, sponsors, registration, scheduling, feedback, and finances"
  }
}
```

**Visual**: AI analysis breakdown showing:
- Identified entities (Speaker, Attendee, Session, etc.)
- Relationships between entities
- Required fields and data types
- Workflow processes

**Step 2: Base Creation**
```json
{
  "name": "genesis.builtin.create_base", 
  "arguments": {
    "requirements": "[detailed requirements]",
    "template_type": "custom"
  }
}
```

**Visual**: Real-time base creation showing:
- Tables being created
- Fields being added
- Relationships being established
- Views being configured

**Step 3: Dashboard Creation**
```json
{
  "name": "genesis.builtin.create_dashboard",
  "arguments": {
    "base_token": "generated_base_token",
    "dashboard_type": "overview"
  }
}
```

**Visual**: Dashboard assembly with:
- Real-time charts and metrics
- Registration statistics
- Financial overview
- Session attendance tracking

---

### Scene 6: Advanced Features Deep Dive (10:00 - 12:00)

**Feature 1: ER Diagram Generation**
```json
{
  "name": "genesis.builtin.generate_er_diagram",
  "arguments": {
    "base_token": "base_token",
    "include_relationships": true
  }
}
```

**Visual**: Animated ER diagram creation showing:
- Tables as entities
- Relationships as connections
- Field types and constraints
- Export options

**Feature 2: Automation Creation**
```json
{
  "name": "genesis.builtin.create_automation",
  "arguments": {
    "base_token": "base_token",
    "automation_type": "notification",
    "trigger": "new_record",
    "action": "send_message"
  }
}
```

**Visual**: Automation workflow builder showing:
- Trigger configuration
- Action definitions
- Notification settings
- Testing process

**Feature 3: Base Optimization**
```json
{
  "name": "genesis.builtin.optimize_base",
  "arguments": {
    "base_token": "base_token",
    "optimization_type": "performance"
  }
}
```

**Visual**: Performance analysis showing:
- Before/after metrics
- Optimization suggestions
- Implementation results

---

### Scene 7: Integration & Production (12:00 - 13:30)

**Topic**: "Taking Genesis creations to production"

**Claude Desktop Integration**:
```json
{
  "mcpServers": {
    "lark-genesis": {
      "command": "npx",
      "args": ["-y", "@larksuiteoapi/lark-mcp@0.4.0", "mcp", "--tools", "preset.genesis.default"],
      "env": {
        "APP_ID": "your_app_id",
        "APP_SECRET": "your_app_secret",
        "GEMINI_API_KEY": "your_gemini_key"
      }
    }
  }
}
```

**Visual Elements**:
- Claude Desktop configuration
- Live Genesis tool integration
- Real Lark Base in browser
- Production workflow demonstration

**Security & Best Practices**:
- Environment variable setup
- API key management
- Rate limiting configuration
- Error handling examples

---

### Scene 8: Tips, Tricks & Troubleshooting (13:30 - 14:30)

**Pro Tips Section**:

1. **Detailed Requirements = Better Results**
   ```text
   ❌ "I need a database for customers"
   ✅ "I need a customer database with contact info, purchase history, 
       communication logs, and automated follow-up scheduling"
   ```

2. **Template Customization**
   ```json
   {
     "template_type": "crm",
     "customizations": {
       "add_fields": ["industry", "company_size"],
       "modify_views": ["sales_pipeline", "customer_health"]
     }
   }
   ```

3. **Performance Optimization**
   ```json
   {
     "optimization_targets": ["query_speed", "storage_efficiency", "user_experience"]
   }
   ```

**Common Issues & Solutions**:
- Token expiration handling
- Large dataset management
- Complex relationship modeling
- Performance tuning

---

### Scene 9: Call to Action & Resources (14:30 - 15:00)

**Visual**: Resource compilation screen

**Resources Provided**:
- GitHub repository: https://github.com/larksuite/lark-openapi-mcp
- Documentation: Complete Genesis guide
- Template library: 6+ business templates
- Community: Discord/GitHub discussions

**Next Steps**:
1. Install Genesis system
2. Configure Claude Desktop
3. Try first template
4. Join community for support

**Contact Information**:
- Documentation: `/docs/GENESIS_GUIDE.md`
- Issues: GitHub Issues
- Discussions: Community channels

---

## 🎥 Production Notes

### Required Assets

**Code Snippets** (Copy-paste ready):
```bash
# Installation
yarn install
yarn build

# Quick start
node dist/cli.js mcp --mode stdio --tools preset.genesis.default

# Configuration
export APP_ID="your_app_id"
export APP_SECRET="your_app_secret" 
export GEMINI_API_KEY="your_gemini_key"
```

**Sample Requirements** (for demonstrations):
1. **CRM System**: "Customer management with lead tracking, sales pipeline, and automated follow-ups"
2. **Project Management**: "Development project tracking with sprints, tasks, and team collaboration"
3. **Event Management**: "Conference organization with speakers, attendees, sessions, and feedback"
4. **HR System**: "Employee management with onboarding, performance reviews, and time tracking"

### Visual Style Guide

**Color Scheme**:
- Primary: Lark Blue (#1890FF)
- Secondary: Genesis Green (#52C41A)
- Accent: Warning Orange (#FA8C16)
- Background: Clean White (#FFFFFF)

**Typography**:
- Headers: Lark Sans Bold
- Body: Lark Sans Regular
- Code: JetBrains Mono

**Animation Style**:
- Smooth transitions (300ms ease-in-out)
- Fade-in effects for new content
- Loading animations for API calls
- Progress indicators for multi-step processes

### Screen Recording Setup

**Resolution**: 1920x1080 (Full HD)
**Frame Rate**: 30fps
**Audio**: High-quality voiceover + background music
**Editing**: 
- Picture-in-picture for code and results
- Zoom effects for important details
- Callout annotations
- Progress indicators

### Required Environments

1. **Terminal Setup**:
   - Clean terminal with syntax highlighting
   - Proper font sizing for readability
   - Clear command prompts

2. **Claude Desktop**:
   - Clean interface setup
   - Proper MCP server configuration
   - Clear conversation history

3. **Lark Base Browser**:
   - Clean browser interface
   - Proper base permissions
   - Clear navigation

4. **Development Environment**:
   - VS Code with proper themes
   - File explorer showing project structure
   - Integrated terminal

### Post-Production Checklist

- [ ] Add captions/subtitles
- [ ] Include chapter markers
- [ ] Add clickable links in description
- [ ] Create thumbnail with key visual elements
- [ ] Generate transcript for accessibility
- [ ] Export in multiple formats (1080p, 720p, 480p)
- [ ] Include downloadable code samples
- [ ] Create supplementary blog post

---

## 📊 Success Metrics

**Engagement Targets**:
- Watch time: >10 minutes average
- Completion rate: >70%
- Click-through to GitHub: >15%
- Community engagement: >50 comments/discussions

**Learning Outcomes**:
- Users can create their first Genesis base
- Users understand template system
- Users can integrate with Claude Desktop
- Users can troubleshoot common issues

This comprehensive video tutorial script provides everything needed to create a professional, engaging video that showcases the full power of the Genesis AI system while providing practical, actionable guidance for users.