# 🚀 CMS-SFA Agent: OpenAI-Powered Lark Base System Creator

## 🎯 Overview

The CMS-SFA Agent is a revolutionary tool that combines the power of OpenAI's GPT-4 with Lark's MCP (Model Context Protocol) tools to automatically create comprehensive Content Management System (CMS) and Sales Force Automation (SFA) systems in Lark Base.

## ✨ Key Features

### 🤖 AI-Powered Design
- **OpenAI GPT-4 Integration**: Advanced AI system architecture design
- **Intelligent Field Mapping**: Automatic field type detection and relationship mapping
- **Error Recovery**: Built-in error handling and progressive enhancement
- **Customizable Prompts**: Tailored system prompts for different use cases

### 📝 CMS System Components
- **Content Management**: Articles, pages, and media library
- **User Management**: Role-based permissions and user administration
- **Category Management**: Hierarchical categories and tagging system
- **Publishing Workflow**: Draft → Review → Published approval process
- **SEO Management**: Meta tags, URLs, and search optimization
- **Analytics Tracking**: View counts, engagement metrics, and performance analytics

### 💼 SFA System Components
- **Lead Management**: Lead capture, qualification, and conversion tracking
- **Contact Management**: Contact details and communication history
- **Account Management**: Company information and relationship management
- **Opportunity Management**: Sales pipeline and forecasting
- **Sales Activities**: Calls, meetings, and task management
- **Performance Analytics**: Sales metrics, KPIs, and performance tracking

## 🛠️ Installation & Setup

### Prerequisites
1. **OpenAI API Key**: Required for AI-powered system design
2. **Lark App Credentials**: Configured in `config.json`
3. **Python 3.7+**: For running the agent
4. **Node.js 16+**: For Lark MCP server

### Agents SDK (Python) Integration

Clone the OpenAI Agents SDK for Python and install dependencies:

```bash
git clone https://github.com/openai/openai-agents-python.git
cd openai-agents-python
python3 -m venv env
source env/bin/activate
pip install openai-agents requests
cd ..
```
### Quick Start

1. **Set OpenAI API Key**:
   ```bash
   export OPENAI_API_KEY='your-openai-api-key-here'
   ```

2. **Install Dependencies**:
   ```bash
   pip3 install openai-agents requests
   yarn install
   ```

3. **Run the Agent**:
   ```bash
   # Full OpenAI-powered version
   ./run-cms-sfa-agent.sh

   # Python Agent (Agents SDK) version
   python3 openai-agents-lark-sfa.py

   # Demo version (no API key required)
   python3 test-cms-sfa-agent.py
   ```

## 📁 Project Structure

```
lark-openapi-mcp/
├── cms-sfa-agent.py              # Main OpenAI agent
├── test-cms-sfa-agent.py         # Demo version
├── run-cms-sfa-agent.sh          # Execution script
├── cms-sfa-agent-guide.md        # Comprehensive guide
├── config.json                   # Lark configuration
├── dist/                         # Built Lark MCP
└── src/                          # Source code
```

## 🎮 Usage Examples

### Creating Both Systems

```bash
# Run the complete agent with OpenAI
./run-cms-sfa-agent.sh
```

This will:
1. Start the Lark MCP server
2. Create both CMS and SFA system designs using OpenAI
3. Generate execution plans and MCP commands
4. Provide Claude Desktop execution prompts

### Demo Version (No API Key Required)

```bash
# Test the agent functionality
python3 test-cms-sfa-agent.py
```

### Individual System Creation

```python
from cms_sfa_agent import CMSSFAAgent

# Initialize agent
agent = CMSSFAAgent(openai_api_key="your-key")

# Create only CMS system
cms_result = agent.create_system_with_openai("cms")

# Create only SFA system
sfa_result = agent.create_system_with_openai("sfa")
```

## 🏗️ System Architecture

### CMS System Tables (8 Tables)

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

### SFA System Tables (8 Tables)

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

## 🔧 MCP Commands Generated

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

## 🎯 Claude Desktop Integration

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

## 🔍 Field Types Supported

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

## 🛡️ Error Handling & Monitoring

### Built-in Features
- **Token Management**: Automatic token refresh and caching
- **API Rate Limiting**: Built-in rate limiting and retry logic
- **Connection Issues**: Automatic reconnection and recovery
- **Validation**: Input validation and error reporting
- **Logging**: Detailed logging for debugging and monitoring

### Log Files
- **Agent Logs**: `/tmp/cms-sfa-agent.log`
- **MCP Server Logs**: Console output and error logs

## 🚀 Advanced Features

### Progressive Enhancement
1. **Start Simple**: Begin with basic tables and add complexity gradually
2. **Test Incrementally**: Verify each table before adding relationships
3. **Error Recovery**: Automatic fallback to simpler configurations
4. **Performance Optimization**: Optimized for query performance

### Customization Options
- **Custom Fields**: Support for custom field types and properties
- **Workflow Rules**: Configurable business rules and automation
- **Integration Hooks**: Webhook support for external system integration
- **Custom Views**: Personalized views and dashboards
- **Advanced Permissions**: Granular permission management

## 📊 Performance & Scalability

### System Capabilities
- **Large Datasets**: Optimized for handling large amounts of data
- **Complex Relationships**: Support for complex table relationships
- **Real-time Updates**: Real-time data synchronization
- **Multi-user Support**: Concurrent user access and collaboration

### Monitoring
- **Health Checks**: System health monitoring and alerts
- **Performance Metrics**: API response time and throughput tracking
- **Error Tracking**: Comprehensive error logging and analysis
- **Usage Analytics**: System usage and performance analytics

## 🔧 Troubleshooting

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

## 📚 Documentation & Resources

### Guides
- [CMS-SFA Agent Guide](cms-sfa-agent-guide.md) - Comprehensive usage guide
- [Lark Base API Documentation](https://open.feishu.cn/document/home/index)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

### Community
- [Lark Developer Community](https://open.feishu.cn/community)
- [GitHub Repository](https://github.com/larksuite/lark-openapi-mcp)
- [Issue Reporting](https://github.com/larksuite/lark-openapi-mcp/issues)

## 🎯 Use Cases

### CMS System Use Cases
- **Blog Management**: Article creation, editing, and publishing
- **Website Content**: Static page management and SEO optimization
- **Media Management**: File upload, organization, and delivery
- **User Management**: Author and editor role management
- **Analytics**: Content performance tracking and optimization

### SFA System Use Cases
- **Lead Management**: Lead capture and qualification process
- **Sales Pipeline**: Opportunity tracking and forecasting
- **Customer Management**: Contact and account relationship management
- **Activity Tracking**: Sales calls, meetings, and task management
- **Performance Analytics**: Sales metrics and KPI tracking

## 🔮 Future Enhancements

### Planned Features
- **Workflow Automation**: Automated approval workflows and notifications
- **Advanced Analytics**: Custom dashboards and reporting
- **Integration APIs**: REST API endpoints for external integrations
- **Mobile Support**: Mobile-optimized interfaces
- **Multi-language Support**: Internationalization and localization
- **Advanced Security**: Role-based access control and audit trails

### Customization Roadmap
- **Custom Fields**: Enhanced custom field type support
- **Workflow Rules**: Advanced business rule configuration
- **Integration Hooks**: Extended webhook and API integration
- **Custom Views**: Advanced view customization options
- **Advanced Permissions**: Enhanced permission management system

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@larksuite.com
- **Documentation**: https://open.feishu.cn/document/home/index
- **Community Forum**: https://open.feishu.cn/community
- **GitHub Issues**: https://github.com/larksuite/lark-openapi-mcp/issues

---

## 🎉 Quick Start Summary

1. **Set up environment**:
   ```bash
   export OPENAI_API_KEY='your-key'
   pip3 install openai requests
   ```

2. **Run the agent**:
   ```bash
   ./run-cms-sfa-agent.sh
   ```

3. **Use generated prompts in Claude Desktop**

4. **Execute MCP commands step by step**

5. **Verify system functionality**

**That's it! You now have a complete CMS and SFA system in Lark Base! 🚀** 