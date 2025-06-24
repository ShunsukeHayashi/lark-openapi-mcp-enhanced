# CMS-SFA Agent Guide

## Overview

The CMS-SFA Agent is a comprehensive OpenAI-powered tool that creates both Content Management System (CMS) and Sales Force Automation (SFA) systems using Lark Base MCP tools. This agent leverages the power of OpenAI's GPT-4 to design and execute complex database systems with proper relationships, workflows, and automation.

## Features

### 🤖 AI-Powered System Design
- **OpenAI GPT-4 Integration**: Uses advanced AI to design optimal system architectures
- **Intelligent Field Mapping**: Automatically determines appropriate field types and relationships
- **Error Recovery**: Built-in error handling and recovery mechanisms
- **Progressive Enhancement**: Starts with basic structure and adds complexity incrementally

### 📝 CMS System Components
- **Content Management**: Articles, pages, and media library management
- **User Management**: Authors, editors, and administrators with role-based permissions
- **Category Management**: Hierarchical categories and tagging system
- **Publishing Workflow**: Draft → Review → Published workflow with approval process
- **SEO Management**: Meta tags, URLs, and search optimization features
- **Analytics Tracking**: View counts, engagement metrics, and performance analytics

### 💼 SFA System Components
- **Lead Management**: Lead capture, qualification, and conversion tracking
- **Contact Management**: Contact details and communication history
- **Account Management**: Company information and relationship management
- **Opportunity Management**: Sales pipeline and forecasting
- **Sales Activities**: Calls, meetings, and task management
- **Performance Analytics**: Sales metrics, KPIs, and performance tracking

## Installation & Setup

### Prerequisites
1. **OpenAI API Key**: Required for AI-powered system design
2. **Lark App Credentials**: App ID and App Secret configured in `config.json`
3. **Python 3.7+**: For running the agent
4. **Node.js 16+**: For Lark MCP server

### Quick Start

1. **Set OpenAI API Key**:
   ```bash
   export OPENAI_API_KEY='your-openai-api-key-here'
   ```

2. **Install Python Dependencies**:
   ```bash
   pip3 install openai requests
   ```

3. **Run the Agent**:
   ```bash
   ./run-cms-sfa-agent.sh
   ```

## System Architecture

### CMS System Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **Content_Articles** | Article management | title, content, author, status, publish_date, seo_meta |
| **Content_Pages** | Static page management | title, slug, content, template, status |
| **Media_Library** | File and media management | file_name, file_url, file_type, file_size, alt_text |
| **Categories** | Content categorization | name, description, parent_category, slug |
| **Tags** | Content tagging | name, description, usage_count |
| **Users** | User management | name, email, role, permissions, last_login |
| **Content_Analytics** | Performance tracking | content_id, views, shares, engagement_score |
| **Publishing_Workflow** | Approval process | content_id, status, reviewer, review_date |

### SFA System Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **Leads** | Lead management | name, email, phone, company, source, status, assigned_to |
| **Contacts** | Contact management | name, email, phone, company, position, lead_source |
| **Accounts** | Company management | company_name, industry, size, website, address |
| **Opportunities** | Sales opportunities | name, account, amount, stage, close_date, probability |
| **Sales_Activities** | Activity tracking | type, subject, contact, date, outcome, notes |
| **Sales_Pipeline** | Pipeline management | stage_name, probability, expected_value |
| **Sales_Metrics** | Performance metrics | salesperson, period, revenue, deals_closed, conversion_rate |
| **Tasks** | Task management | subject, assigned_to, due_date, priority, status, related_to |

## Usage Examples

### Creating Both Systems

```bash
# Run the complete agent
./run-cms-sfa-agent.sh
```

This will:
1. Start the Lark MCP server
2. Create both CMS and SFA system designs using OpenAI
3. Generate execution plans and MCP commands
4. Provide Claude Desktop execution prompts

### Creating Individual Systems

```python
from cms_sfa_agent import CMSSFAAgent

# Initialize agent
agent = CMSSFAAgent(openai_api_key="your-key")

# Create only CMS system
cms_result = agent.create_system_with_openai("cms")

# Create only SFA system
sfa_result = agent.create_system_with_openai("sfa")
```

## MCP Commands Generated

The agent generates specific MCP commands for system creation:

### Base Creation
```bash
# Create CMS Base
bitable.v1.app.create --name "CMS-System" --description "Content Management System"

# Create SFA Base
bitable.v1.app.create --name "SFA-System" --description "Sales Force Automation System"
```

### Table Creation
```bash
# Create CMS Tables
bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name "Content_Articles"
bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name "Content_Pages"
# ... more tables

# Create SFA Tables
bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name "Leads"
bitable.v1.appTable.create --app_token <APP_TOKEN> --table_name "Contacts"
# ... more tables
```

### Field Creation
```bash
# Add fields to tables
bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name "title" --type 1
bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name "content" --type 1
bitable.v1.appTableField.create --app_token <APP_TOKEN> --table_id <TABLE_ID> --field_name "author" --type 11
```

## Claude Desktop Integration

The agent generates specific prompts for Claude Desktop execution:

### CMS Execution Prompt
```
Lark MCPツールを使用して、OpenAI Agentが設計したCMS（Content Management System）を実行してください。

CMSシステム仕様:
- Base名: CMS-System
- 8テーブル構成 (Content_Articles, Content_Pages, Media_Library, Categories, Tags, Users, Content_Analytics, Publishing_Workflow)
- コンテンツ管理機能
- ユーザー管理機能
- カテゴリ・タグ管理
- 公開ワークフロー
- SEO管理
- アナリティクス追跡

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。
```

### SFA Execution Prompt
```
Lark MCPツールを使用して、OpenAI Agentが設計したSFA（Sales Force Automation）システムを実行してください。

SFAシステム仕様:
- Base名: SFA-System
- 8テーブル構成 (Leads, Contacts, Accounts, Opportunities, Sales_Activities, Sales_Pipeline, Sales_Metrics, Tasks)
- リード管理機能
- コンタクト管理機能
- アカウント管理機能
- オポチュニティ管理機能
- 営業活動管理
- パフォーマンス分析

段階的に作成し、各ステップの成功を確認してから次に進んでください。
エラーが発生した場合は、シンプルな構成から開始して徐々に機能を追加してください。
```

## Advanced Configuration

### Custom Field Types

The agent supports all Lark Base field types:

| Field Type | ID | Description |
|------------|----|-------------|
| TEXT | 1 | Text input |
| NUMBER | 2 | Numeric input |
| SINGLE_SELECT | 3 | Dropdown selection |
| MULTI_SELECT | 4 | Multiple choice |
| DATETIME | 5 | Date and time |
| CHECKBOX | 7 | Boolean checkbox |
| USER | 11 | User selection |
| PHONE | 13 | Phone number |
| URL | 15 | URL input |
| ATTACHMENT | 17 | File attachment |
| LINK | 18 | Link to other table |
| LOOKUP | 19 | Lookup field |
| ROLLUP | 20 | Rollup calculation |
| FORMULA | 21 | Formula field |
| AUTO_NUMBER | 22 | Auto-incrementing number |

### Error Handling

The agent includes comprehensive error handling:

1. **Token Management**: Automatic token refresh and caching
2. **API Rate Limiting**: Built-in rate limiting and retry logic
3. **Connection Issues**: Automatic reconnection and recovery
4. **Validation**: Input validation and error reporting
5. **Logging**: Detailed logging for debugging and monitoring

## Monitoring & Logging

### Log Files
- **Agent Logs**: `/tmp/cms-sfa-agent.log`
- **MCP Server Logs**: Console output and error logs

### Health Monitoring
The agent includes system health monitoring:
- Token expiration tracking
- API response monitoring
- Error rate tracking
- Performance metrics

## Troubleshooting

### Common Issues

1. **OpenAI API Key Not Set**
   ```bash
   export OPENAI_API_KEY='your-api-key'
   ```

2. **Lark MCP Server Not Starting**
   ```bash
   # Check if port is in use
   lsof -i :3000
   
   # Restart MCP server
   node dist/cli.js mcp --config config.json
   ```

3. **Python Dependencies Missing**
   ```bash
   pip3 install openai requests
   ```

4. **Permission Issues**
   ```bash
   chmod +x run-cms-sfa-agent.sh
   ```

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Best Practices

### System Design
1. **Start Simple**: Begin with basic tables and add complexity gradually
2. **Test Incrementally**: Verify each table before adding relationships
3. **Use Meaningful Names**: Use clear, descriptive table and field names
4. **Plan Relationships**: Design table relationships before implementation
5. **Consider Performance**: Optimize for query performance and data volume

### Data Management
1. **Backup Regularly**: Create regular backups of your Base applications
2. **Validate Data**: Implement data validation rules
3. **Monitor Usage**: Track API usage and performance
4. **Document Changes**: Keep documentation of system modifications
5. **Version Control**: Maintain version history of system changes

## Future Enhancements

### Planned Features
- **Workflow Automation**: Automated approval workflows and notifications
- **Advanced Analytics**: Custom dashboards and reporting
- **Integration APIs**: REST API endpoints for external integrations
- **Mobile Support**: Mobile-optimized interfaces
- **Multi-language Support**: Internationalization and localization
- **Advanced Security**: Role-based access control and audit trails

### Customization Options
- **Custom Fields**: Support for custom field types and properties
- **Workflow Rules**: Configurable business rules and automation
- **Integration Hooks**: Webhook support for external system integration
- **Custom Views**: Personalized views and dashboards
- **Advanced Permissions**: Granular permission management

## Support & Resources

### Documentation
- [Lark Base API Documentation](https://open.feishu.cn/document/home/index)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### Community
- [Lark Developer Community](https://open.feishu.cn/community)
- [GitHub Repository](https://github.com/larksuite/lark-openapi-mcp)
- [Issue Reporting](https://github.com/larksuite/lark-openapi-mcp/issues)

### Contact
For support and questions:
- Email: support@larksuite.com
- Documentation: https://open.feishu.cn/document/home/index
- Community Forum: https://open.feishu.cn/community 