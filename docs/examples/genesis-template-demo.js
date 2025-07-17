#!/usr/bin/env node

/**
 * Genesis Template Demo
 * Demonstrates how to use Genesis templates to create Lark Base applications
 */

const { LarkMcpTool } = require('../dist/mcp-tool');

// Configuration
const config = {
  appId: process.env.APP_ID || 'your_app_id',
  appSecret: process.env.APP_SECRET || 'your_app_secret',
};

async function main() {
  console.log('🚀 Genesis Template Demo\n');

  // Initialize the MCP tool
  const larkTool = new LarkMcpTool(config);

  try {
    // 1. List available templates
    console.log('📋 Available Genesis Templates:');
    console.log('================================');
    const templates = [
      { id: 'crm', name: 'Customer Relationship Management', icon: '🏆' },
      { id: 'project_management', name: 'Project Management', icon: '📊' },
      { id: 'hr_management', name: 'HR Management', icon: '🏢' },
      { id: 'inventory_management', name: 'Inventory Management', icon: '📦' },
      { id: 'event_planning', name: 'Event Planning', icon: '🎉' },
      { id: 'bug_tracking', name: 'Bug Tracking', icon: '🐛' }
    ];

    templates.forEach(template => {
      console.log(`${template.icon} ${template.id}: ${template.name}`);
    });

    // 2. Demonstrate template creation (simulation mode)
    console.log('\n\n🔨 Creating CRM from template (simulation mode):');
    console.log('================================================');

    const crmResult = {
      success: true,
      mode: 'simulation',
      baseId: 'simulated_base_123',
      template: 'crm',
      tables: [
        { name: 'Customers', fields: 12 },
        { name: 'Contacts', fields: 10 },
        { name: 'Opportunities', fields: 11 },
        { name: 'Activities', fields: 9 }
      ],
      views: [
        'Pipeline Kanban',
        'My Activities',
        'High-Value Customers',
        'Forecast Report'
      ],
      automations: [
        'New opportunity notifications',
        'Follow-up reminders',
        'Stage change alerts'
      ],
      dashboards: [
        'Sales Overview',
        'Activity Metrics',
        'Revenue Forecast'
      ]
    };

    console.log('✅ Base created successfully!');
    console.log(`📊 Base ID: ${crmResult.baseId}`);
    console.log(`📋 Template: ${crmResult.template}`);
    console.log(`📁 Tables: ${crmResult.tables.length}`);
    crmResult.tables.forEach(table => {
      console.log(`   - ${table.name} (${table.fields} fields)`);
    });
    console.log(`👁️ Views: ${crmResult.views.length}`);
    crmResult.views.forEach(view => {
      console.log(`   - ${view}`);
    });
    console.log(`🤖 Automations: ${crmResult.automations.length}`);
    console.log(`📈 Dashboards: ${crmResult.dashboards.length}`);

    // 3. Show template customization example
    console.log('\n\n🎨 Template Customization Example:');
    console.log('==================================');
    console.log('After creating from template, you can:');
    console.log('1. Add custom fields:');
    console.log('   - Customer Segment (Enterprise/SMB/Startup)');
    console.log('   - Lead Source (Website/Referral/Event/Cold Call)');
    console.log('   - Customer Health Score (0-100)');
    console.log('\n2. Create custom views:');
    console.log('   - Enterprise Accounts Only');
    console.log('   - Deals Closing This Month');
    console.log('   - At-Risk Customers');
    console.log('\n3. Add custom automations:');
    console.log('   - Slack notification for deals > $50k');
    console.log('   - Auto-assign based on territory');
    console.log('   - Weekly pipeline report email');

    // 4. Show usage instructions
    console.log('\n\n📖 How to Use in Production:');
    console.log('============================');
    console.log('1. Set your Lark API credentials:');
    console.log('   export APP_ID="your_app_id"');
    console.log('   export APP_SECRET="your_app_secret"');
    console.log('\n2. Use the Genesis tool with real API:');
    console.log('   genesis.builtin.create_base({');
    console.log('     baseName: "My Company CRM",');
    console.log('     options: {');
    console.log('       template: "crm",');
    console.log('       useRealAPI: true  // Enable real creation');
    console.log('     }');
    console.log('   })');
    console.log('\n3. Or use MCP prompt for guided creation:');
    console.log('   Use prompt: genesis_templates');
    console.log('   With arguments: template_id="crm", base_name="My CRM"');

    // 5. Show template comparison
    console.log('\n\n📊 Template Comparison:');
    console.log('======================');
    console.log('┌─────────────────────┬──────────┬────────┬─────────────┬─────────────┐');
    console.log('│ Template            │ Tables   │ Views  │ Automations │ Best For    │');
    console.log('├─────────────────────┼──────────┼────────┼─────────────┼─────────────┤');
    console.log('│ CRM                 │ 4        │ 4      │ 3           │ Sales teams │');
    console.log('│ Project Management  │ 4        │ 4      │ 3           │ Dev teams   │');
    console.log('│ HR Management       │ 4        │ 4      │ 3           │ HR teams    │');
    console.log('│ Inventory Mgmt      │ 4        │ 3      │ 2           │ Operations  │');
    console.log('│ Event Planning      │ 3        │ 3      │ 2           │ Event teams │');
    console.log('│ Bug Tracking        │ 3        │ 3      │ 2           │ QA teams    │');
    console.log('└─────────────────────┴──────────┴────────┴─────────────┴─────────────┘');

    console.log('\n\n✨ Demo completed successfully!');
    console.log('📚 For more information, see docs/genesis-templates.md');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };