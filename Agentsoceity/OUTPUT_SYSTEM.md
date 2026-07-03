# Agent Output System Documentation

## Overview

The Agent Output System is a comprehensive solution for exporting and formatting agent configurations in multiple formats. It supports JSON, CSV, and professional PDF exports with rich text editing capabilities.

## Features

### 1. **JSON Export**
- **Individual Agent Export**: Export a single agent configuration as JSON
- **Complete Export**: Export all agents as a single JSON file with metadata
- **Structured Format**: Includes timestamps, summaries, and complete agent details

**Use Cases:**
- Backup agent configurations
- Version control and auditing
- Integration with other systems
- Data analysis and reporting

### 2. **CSV Export**
- Export all agents in spreadsheet format
- Perfect for Excel/Google Sheets integration
- Includes key agent properties and metadata

**Use Cases:**
- Quick agent comparison
- Spreadsheet analysis
- Bulk data import to other tools

### 3. **PDF Export**
- Professional formatted reports
- Agent cards with visual formatting
- Custom content support
- Print-ready format

**Features:**
- Color-coded agent indicators
- Rich formatting and styling
- Page breaks for optimal printing
- Summary statistics

### 4. **Rich Text Editor**
- Markdown support for custom content
- Live preview
- Template library
- Undo/Redo functionality
- Custom note formatting

## Architecture

### File Structure

```
src/
├── lib/
│   ├── output-service.js       # Core export functions
│   └── output-utils.js         # Advanced formatting utilities
├── store/
│   └── content-editor-store.js # Content editor state management
├── components/
│   └── output/
│       ├── OutputToolbar.js    # Main toolbar with export button
│       ├── ExportDialog.js     # Export format selection dialog
│       └── ContentEditor.js    # Rich text editor modal
└── app/api/
    └── export/
        ├── json/route.js       # JSON export API
        ├── csv/route.js        # CSV export API
        └── pdf/route.js        # PDF generation API
```

## Usage

### Basic Export (Client-Side)

```javascript
import { exportAgentAsJson, exportAllAgentsAsJson } from "@/lib/output-service";

// Export single agent
const agent = { id: "1", name: "Agent 1", ... };
exportAgentAsJson(agent, "agent-config.json");

// Export all agents
exportAllAgentsAsJson(agents, "agents-export.json");
```

### Using the Output Toolbar

```javascript
import OutputToolbar from "@/components/output/OutputToolbar";

export default function MyComponent() {
  const agents = []; // Your agents

  return (
    <OutputToolbar agents={agents} />
  );
}
```

### Programmatic Export

```javascript
import { createStructuredJsonExport } from "@/lib/output-utils";

const exportData = createStructuredJsonExport(agents, customContent);
const jsonString = JSON.stringify(exportData, null, 2);
```

## Content Editor Features

### Markdown Formatting Support

| Syntax | Result |
|--------|--------|
| `# Heading 1` | Large heading |
| `## Heading 2` | Medium heading |
| `### Heading 3` | Small heading |
| `**bold**` | **Bold text** |
| `*italic*` | *Italic text* |
| `- Item` | Bullet list |
| `[Link text](url)` | Hyperlink |

### Templates

The editor includes pre-built templates for common sections:

- **Headers**: Title, Section, Subsection
- **Formatting**: Bold, Italic, Lists
- **Sections**: Summary, Findings, Recommendations, Risks

### Undo/Redo

The editor maintains a full history of changes:

```javascript
const store = useContentEditorStore();

store.undo();      // Go to previous version
store.redo();      // Go to next version
store.clearContent(); // Clear all content
```

## API Endpoints

### JSON Export

**POST** `/api/export/json`

```javascript
{
  "agents": [...],
  "customContent": "Optional custom markdown content",
  "exportType": "all" // or agent ID for single export
}
```

**Response:**
```json
{
  "exportDate": "2024-01-01T00:00:00.000Z",
  "summary": {
    "totalAgents": 5,
    "enabledCount": 4,
    "disabledCount": 1
  },
  "agents": [...]
}
```

### CSV Export

**POST** `/api/export/csv`

Returns CSV file with headers:
- Name
- Role
- Icon
- AI Provider
- Model
- Temperature
- Enabled
- Description
- Created
- Updated

### PDF Export

**POST** `/api/export/pdf`

```javascript
{
  "agents": [...],
  "customContent": "Markdown content",
  "filename": "agents-report.html"
}
```

Returns HTML that can be printed to PDF.

## Advanced Features

### Export Comparison

Generate statistical analysis of agents:

```javascript
import { createAgentComparison } from "@/lib/output-utils";

const comparison = createAgentComparison(agents);
// Returns: byProvider, byModel, byTemperature, enabledVsDisabled
```

### Format Converters

Convert content between formats:

```javascript
import { formatConverters } from "@/lib/output-utils";

const plainText = formatConverters.toPlainText(content);
const html = formatConverters.toHtml(content);
const markdown = formatConverters.toMarkdown(content);
```

### Comprehensive Reports

Generate detailed analysis reports:

```javascript
import { generateComprehensiveReport } from "@/lib/output-utils";

const report = generateComprehensiveReport(agents, customContent);
// Includes: summary, agents, analysis, customContent
```

## Customization

### Adding New Export Formats

1. Create a new function in `output-service.js`:

```javascript
export function exportAgentAsXml(agent) {
  // Implementation
}
```

2. Add to export dialog in `ExportDialog.js`:

```javascript
{
  id: "xml",
  label: "Agent (XML)",
  description: "Export as XML format"
}
```

3. Handle in export handler:

```javascript
else if (exportFormat === "xml") {
  const agent = agents.find((a) => a.id === selectedAgentId);
  exportAgentAsXml(agent);
}
```

### Customizing PDF Styling

Edit the HTML styling in `output-service.js` `buildPdfContent()` function:

```javascript
const customContentHtml = `
  <div style="your-custom-styles">
    ${contentToHtml(customContent)}
  </div>
`;
```

## Performance Considerations

- **Large Agent Sets**: CSV export handles thousands of agents efficiently
- **PDF Generation**: Client-side generation for instant feedback
- **Content Editor**: Undo/Redo uses incremental storage (O(1) space per change)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Limited print functionality

## Error Handling

All export functions include error handling:

```javascript
try {
  exportAllAgentsAsJson(agents);
} catch (error) {
  console.error("Export error:", error);
  alert(`Export failed: ${error.message}`);
}
```

## Future Enhancements

- [ ] Excel format support (.xlsx)
- [ ] Database backup format
- [ ] Cloud storage integration
- [ ] Scheduled exports
- [ ] Export templates
- [ ] Batch processing for large datasets

## Troubleshooting

### Export Button Disabled
- Ensure agents array is not empty
- Check that agents have required properties

### PDF Not Generating
- Verify custom content is valid Markdown
- Check browser console for errors
- Ensure sufficient memory available

### Content Not Saving
- Verify Zustand store is properly initialized
- Check browser localStorage limits
- Clear cache and retry

## Contributing

To add new features to the output system:

1. Add functionality to appropriate utility file
2. Update components if UI changes needed
3. Add API routes if server-side processing required
4. Update this documentation

## License

Same as project license
