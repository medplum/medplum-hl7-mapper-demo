# Medplum HL7v2 Mapper

A powerful, interactive tool for transforming HL7v2 messages with real-time feedback and code generation.

## Overview

The Medplum HL7v2 Mapper is a specialized web application designed to simplify the complex task of transforming HL7v2 messages. Whether you're integrating with legacy healthcare systems, normalizing data formats, or building custom healthcare workflows, this tool provides an intuitive interface for creating, testing, and exporting HL7 transformations.

**Note:** This project is in early development. While functional, you may encounter bugs or limitations.

## Key Features

- **Visual Transformation Builder**: Create complex HL7 transformations without writing code
- **Real-time Feedback**: See the results of your transformations instantly
- **Diff Visualization**: Easily compare expected vs. actual output
- **Code Generation**: Export your transformations as TypeScript code for use in Medplum Bots
- **Dynamic Testing**: Generated code is executed in real-time within the application
- **Template Library**: Save and reuse message pairs for consistent testing

## How It Works

### 1. Message Setup

- **Input Message**: Paste your source HL7v2 message
- **Expected Output**: Define what you expect the transformed message to look like
- **Save Templates**: Save input/expected pairs for future use with custom names

### 2. Define Transformations

- **Filters**: Create conditions that determine when transformations should be applied
  - Filter on any segment/field using dot notation (e.g., `MSH.3`, `PID.5.1`)
  - Combine multiple conditions with AND/OR operators
  - Use various matching functions: contains, startsWith, endsWith, exact

- **Mappings**: Define how data should be transformed when filters match
  - Map from any source field to any destination field
  - Chain multiple transformations together
  - Available transformations:
    - Replace text
    - Add/remove prefixes and suffixes
    - Passthrough (copy without changes)

### 3. Test and Refine

- **Transform Button**: Apply your transformations to the input message
- **Real-time Diff**: See color-coded differences between expected and actual output
- **Iterative Development**: Refine your transformations until the output matches expectations

### 4. Export and Deploy

- **Code Generation**: Export your transformations as a TypeScript file
- **Dynamic Execution**: Generated code is automatically imported and executed in the browser
- **Medplum Integration**: Use the exported code directly in Medplum Bots

## Technical Highlights

- **Dynamic Code Execution**: Transforms are converted to TypeScript code that is dynamically imported back into the application for testing
- **Local Storage**: Templates are saved to browser local storage for persistence between sessions
- **Modern UI**: Built with Mantine UI components for a clean, responsive interface
- **Type Safety**: Fully typed with TypeScript for reliability

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Begin by selecting a template message or pasting your own HL7v2 message
5. Define your expected output
6. Add filters and mappings to transform the input
7. Click "Transform" to see the results

## Future Development

- Support for more complex transformations
- Import/export of transformation configurations
- Integration with Medplum API for direct deployment

---

The Medplum HL7v2 Mapper represents a new approach to healthcare integration, making it easier to work with the complex, often challenging HL7v2 message format. By providing immediate feedback and generating deployable code, it bridges the gap between integration design and implementation.
