import { ActionIcon, Button, Group, InputLabel, Select, Stack, Table, TextInput, Textarea, Drawer, List, ThemeIcon, Divider } from "@mantine/core";
import { Hl7Message } from "@medplum/core";
import { IconPlus, IconTrash, IconMenu2, IconMessage, IconCheck, IconDeviceFloppy } from "@tabler/icons-react";
import { diffChars } from "diff";
import React, { useCallback, useState, useEffect } from "react";
import { Filter, FilterRow, Mapping, Transform, applyTransforms } from "./util/transform";
import { saveAs } from 'file-saver';

// Define a type for our message templates
interface MessageTemplate {
  name: string;
  input: string;
  expected: string;
}

// Create a list of default sample messages
const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    name: "ORU R01 - Radiology Report",
    input: `MSH|^~\\&|MESA_RPT_MGR|EAST_RADIOLOGY|iFW|XYZ|||ORU^R01|MESA3b|P|2.4||||||||
    PID|||CR3^^^ADT1||CRTHREE^PAUL|||||||||||||PatientAcct||||||||||||
    PV1||1|CE||||12345^SMITH^BARON^H|||||||||||
    OBR|||||||20010501141500.0000||||||||||||||||||F||||||||||||||||||
    OBX|1|HD|SR Instance UID||1.113654.1.2001.30.2.1||||||F||||||
    OBX|2|TX|SR Text||Radiology Report History Cough Findings PA evaluation of the chest demonstrates the lungs to be expanded and clear.  Conclusions Normal PA chest x-ray.||||||F||||||`,
    expected: `MSH|^~\\&|mesa_RPT_MGR|EAST_radiology|iFW|XYZ|||ORU^R01|MESA3b|P|2.4||||||||
PID|||CR3^^^ADT1||CRTHREE^PAUL|||||||||||||PatientAcct||||||||||||
PV1||1|CE||||12345^SMITH^BARON^H|||||||||||
OBR|||||||20010501141500.0000||||||||||||||||||F||||||||||||||||||
OBX|1|HD|SR Instance UID||1.113654.1.2001.30.2.1||||||F||||||
    OBX|2|TX|SR Text||Radiology Report History Cough Findings PA evaluation of the chest demonstrates the lungs to be expanded and clear.  Conclusions Normal PA chest x-ray.||||||F||||||`
  },
  {
    name: "ADT A01 - Patient Admission",
    input: `MSH|^~\\&|MESA_ADT|EAST_HOSPITAL|RECEIVER|DEST|20230101120000||ADT^A01|MSG00001|P|2.5|||AL|NE|
    EVN|A01|20230101120000|||
    PID|1||10001^^^MRN||SMITH^JOHN||19800101|M|||123 MAIN ST^^ANYTOWN^CA^90210||555-555-5555||S||10001|123-45-6789||||
    PV1|1|I|WEST^389^1|1|||12345^DOCTOR^ROBERT|67890^DOCTOR^JANE||MED||||1|A0|`,
    expected: `MSH|^~\\&|mesa_ADT|EAST_hospital|RECEIVER|DEST|20230101120000||ADT^A01|MSG00001|P|2.5|||AL|NE|
    EVN|A01|20230101120000|||
    PID|1||10001^^^MRN||SMITH^JOHN||19800101|M|||123 MAIN ST^^ANYTOWN^CA^90210||555-555-5555||S||10001|123-45-6789||||
    PV1|1|I|WEST^389^1|1|||12345^DOCTOR^ROBERT|67890^DOCTOR^JANE||MED||||1|A0|`
  },
  {
    name: "ORM O01 - Order Message",
    input: `MSH|^~\\&|MESA_ORM|EAST_CLINIC|RECEIVER|DEST|20230101120000||ORM^O01|MSG00001|P|2.5|||AL|NE|
    PID|1||10001^^^MRN||SMITH^JOHN||19800101|M|||123 MAIN ST^^ANYTOWN^CA^90210||555-555-5555||S||10001|123-45-6789||||
    ORC|NW|ORD123456|||||^^^20230101120000||||12345^DOCTOR^ROBERT|
    OBR|1|ORD123456||76770^ULTRASOUND RETROPERITONEAL^CPT|R||20230101120000|||||||||12345^DOCTOR^ROBERT||||||||||`,
    expected: `MSH|^~\\&|mesa_ORM|EAST_clinic|RECEIVER|DEST|20230101120000||ORM^O01|MSG00001|P|2.5|||AL|NE|
    PID|1||10001^^^MRN||SMITH^JOHN||19800101|M|||123 MAIN ST^^ANYTOWN^CA^90210||555-555-5555||S||10001|123-45-6789||||
    ORC|NW|ORD123456|||||^^^20230101120000||||12345^DOCTOR^ROBERT|
    OBR|1|ORD123456||76770^ULTRASOUND RETROPERITONEAL^CPT|R||20230101120000|||||||||12345^DOCTOR^ROBERT||||||||||`
  }
];

// Local storage key
const STORAGE_KEY = 'medplum:hl7Templates';

// Helper function to load templates from localStorage
const loadTemplatesFromStorage = (): MessageTemplate[] => {
  try {
    const storedTemplates = localStorage.getItem(STORAGE_KEY);
    if (storedTemplates) {
      return JSON.parse(storedTemplates);
    }
  } catch (error) {
    console.error('Error loading templates from localStorage:', error);
  }
  return DEFAULT_TEMPLATES;
};

// Helper function to save templates to localStorage
const saveTemplatesToStorage = (templates: MessageTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates to localStorage:', error);
  }
};

const oru = Hl7Message.parse(DEFAULT_TEMPLATES[0].input);
const oruExpected = Hl7Message.parse(DEFAULT_TEMPLATES[0].expected);

// Update HL7_LABELS to use dot notation
const HL7_LABELS = {
  "MSH.1": "Field Separator",
  "MSH.2": "Encoding Characters",
  "MSH.3": "Sending Application",
  "MSH.4": "Sending Facility",
  "MSH.5": "Receiving Application",
  "MSH.6": "Receiving Facility",
  "MSH.7": "Date/Time of Message",
  "MSH.9": "Message Type",
  "MSH.9.1": "Message Code",
  "MSH.9.2": "Trigger Event",
  "MSH.9.3": "Message Structure",
  "MSH.10": "Message Control ID",
  "MSH.11": "Processing ID",
  "MSH.12": "Version ID",

  "PID.1": "Set ID - PID",
  "PID.2": "Patient ID",
  "PID.3": "Patient Identifier List",
  "PID.3.1": "ID Number",
  "PID.3.2": "Check Digit",
  "PID.3.3": "Check Digit Scheme",
  "PID.3.4": "Assigning Authority",
  "PID.3.5": "Identifier Type Code",
  "PID.4": "Alternate Patient ID",
  "PID.5": "Patient Name",
  "PID.5.1": "Family Name",
  "PID.5.2": "Given Name",
  "PID.5.3": "Middle Name",
  "PID.5.4": "Suffix",
  "PID.5.5": "Prefix",
  "PID.7": "Date/Time of Birth",
  "PID.8": "Administrative Sex",
  "PID.11": "Patient Address",
  "PID.11.1": "Street Address",
  "PID.11.2": "Other Designation",
  "PID.11.3": "City",
  "PID.11.4": "State/Province",
  "PID.11.5": "ZIP/Postal Code",
  "PID.11.6": "Country",

  "OBR.1": "Set ID - OBR",
  "OBR.2": "Placer Order Number",
  "OBR.3": "Filler Order Number",
  "OBR.4": "Universal Service ID",
  "OBR.4.1": "Identifier",
  "OBR.4.2": "Text",
  "OBR.4.3": "Name of Coding System",
  "OBR.7": "Observation Date/Time",
  "OBR.8": "Observation End Date/Time",
  "OBR.16": "Ordering Provider",
  "OBR.16.1": "ID Number",
  "OBR.16.2": "Family Name",
  "OBR.16.3": "Given Name",
  "OBR.22": "Results Rpt/Status Chng - Date/Time",
  "OBR.25": "Result Status",

  "OBX.1": "Set ID - OBX",
  "OBX.2": "Value Type",
  "OBX.3": "Observation Identifier",
  "OBX.3.1": "Identifier",
  "OBX.3.2": "Text",
  "OBX.3.3": "Name of Coding System",
  "OBX.4": "Observation Sub-ID",
  "OBX.5": "Observation Value",
  "OBX.6": "Units",
  "OBX.6.1": "Identifier",
  "OBX.6.2": "Text",
  "OBX.6.3": "Name of Coding System",
  "OBX.7": "References Range",
  "OBX.8": "Abnormal Flags",
  "OBX.11": "Observation Result Status",
  "OBX.14": "Date/Time of the Observation",

  "NTE.1": "Set ID - NTE",
  "NTE.2": "Source of Comment",
  "NTE.3": "Comment",
  "NTE.4": "Comment Type",

  "SPM.1": "Set ID - SPM",
  "SPM.2": "Specimen ID",
  "SPM.2.1": "Container Identifier",
  "SPM.2.2": "Position in Container",
  "SPM.3": "Specimen Parent IDs",
  "SPM.4": "Specimen Type",
  "SPM.4.1": "Identifier",
  "SPM.4.2": "Text",
  "SPM.4.3": "Name of Coding System",
  "SPM.17": "Specimen Collection Date/Time",
  "SPM.18": "Specimen Received Date/Time",

  "ORC.1": "Order Control",
  "ORC.2": "Placer Order Number",
  "ORC.3": "Filler Order Number",
  "ORC.4": "Placer Group Number",
  "ORC.5": "Order Status",
  "ORC.9": "Date/Time of Transaction",
  "ORC.12": "Ordering Provider",
  "ORC.12.1": "ID Number",
  "ORC.12.2": "Family Name",
  "ORC.12.3": "Given Name",
};

// List all the segments in the ORU^R01 message in the HL7v2.5 format from the internet and put them in an array

// Create a react component that will take in the oru message and display it in a content editable div
// Use mantine components where possible
// Hardcode one box to hold message (oru)
// Transform button
/// Another box
// onClick transform button, call transform fn
// transform(input, transformChain, output)

const INITIAL_TRANSFORM: Transform = {
  id: "1",
  command: "passthrough",
  args: "",
};

const INITIAL_MAPPING: Mapping = {
  id: "1",
  src: "",
  dst: "",
  transforms: [INITIAL_TRANSFORM],
};

const INITIAL_FILTER_ROW: FilterRow = {
  id: "1",
  operator: "AND",
  command: "contains",
  value: "",
};

const INITIAL_FILTER: Filter = {
  id: "1",
  src: "",
  filterRows: [INITIAL_FILTER_ROW],
  mappings: [INITIAL_MAPPING],
};

const OPERATOR_OPTIONS = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];

const FILTER_FUNCTION_OPTIONS = [
  { value: "startsWith", label: "Starts With" },
  { value: "contains", label: "Contains" },
  { value: "endsWith", label: "Ends With" },
  { value: "exact", label: "Exact Match" },
];

const TRANSFORM_FUNCTION_OPTIONS = [
  { value: "replace", label: "Replace" },
  { value: "passthrough", label: "Passthrough" },
  { value: "addPrefix", label: "Add Prefix" },
  { value: "removePrefix", label: "Remove Prefix" },
  { value: "addSuffix", label: "Add Suffix" },
  { value: "removeSuffix", label: "Remove Suffix" },
  // Add more functions as needed
];

// Add this helper to convert HL7_LABELS to Select data format
const HL7_SELECT_DATA = Object.entries(HL7_LABELS).map(([key, label]) => ({
  value: key,
  label: `${key} - ${label}`,
}));

// Add this type for diff styling
interface DiffStyles {
  added: React.CSSProperties;
  removed: React.CSSProperties;
  unchanged: React.CSSProperties;
}

const diffStyles: DiffStyles = {
  added: {
    backgroundColor: "rgba(0, 255, 0, 0.2)",
    color: "darkgreen",
  },
  removed: {
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    color: "darkred",
  },
  unchanged: {
    color: "inherit",
  },
};

// Add this component for rendering diffs
function DiffView({ actual, expected }: { actual: string; expected: string }) {
  const diff = diffChars(expected, actual);

  return (
    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {diff.map((part, index) => {
        const style = part.added ? diffStyles.added : part.removed ? diffStyles.removed : diffStyles.unchanged;
        return (
          <span key={index} style={style}>
            {part.value}
          </span>
        );
      })}
    </pre>
  );
}

export function App() {
  const [input, setInput] = useState(oru.toString());
  const [output, setOutput] = useState(oru.toString());
  const [expected, setExpected] = useState(oruExpected.toString());
  const [filters, setFilters] = useState<Filter[]>([INITIAL_FILTER]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [generatedBotCode, setGeneratedBotCode] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const loadedTemplates = loadTemplatesFromStorage();
    setTemplates(loadedTemplates);
    
    // Set initial input and expected from the first template
    if (loadedTemplates.length > 0) {
      setInput(loadedTemplates[0].input);
      setExpected(loadedTemplates[0].expected);
    }
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      saveTemplatesToStorage(templates);
    }
  }, [templates]);

  // Function to select a message template
  const selectMessageTemplate = (index: number) => {
    setInput(templates[index].input);
    setExpected(templates[index].expected);
    setSelectedMessageIndex(index);
    setSidebarOpen(false); // Close sidebar after selection
  };

  // Function to save current input/expected as a new template
  const saveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a name for the template');
      return;
    }

    const newTemplate: MessageTemplate = {
      name: newTemplateName.trim(),
      input: input,
      expected: expected
    };

    setTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName(''); // Clear the input field
    setSidebarOpen(true); // Open the sidebar to show the new template
    setSelectedMessageIndex(templates.length); // Select the new template
  };

  // Function to delete a template
  const deleteTemplate = (index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the selectMessageTemplate
    
    if (window.confirm(`Are you sure you want to delete the template "${templates[index].name}"?`)) {
      setTemplates(prev => {
        const newTemplates = [...prev];
        newTemplates.splice(index, 1);
        return newTemplates;
      });
      
      // If we deleted the currently selected template, select the first one
      if (index === selectedMessageIndex) {
        if (templates.length > 1) {
          selectMessageTemplate(0);
        }
      } else if (index < selectedMessageIndex) {
        // If we deleted a template before the selected one, adjust the index
        setSelectedMessageIndex(selectedMessageIndex - 1);
      }
    }
  };

  const addFilter = () => {
    setFilters((current) => [
      ...current,
      {
        ...INITIAL_FILTER,
        id: (current.length + 1).toString(),
      },
    ]);
  };

  const deleteFilter = (filterId: string) => {
    setFilters((current) => current.filter((f) => f.id !== filterId));
  };

  const updateFilterSource = (filterId: string, src: string) => {
    setFilters((current) => current.map((filter) => (filter.id === filterId ? { ...filter, src } : filter)));
  };

  const addFilterRow = (filterId: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            filterRows: [
              ...filter.filterRows,
              {
                ...INITIAL_FILTER_ROW,
                id: (filter.filterRows.length + 1).toString(),
              },
            ],
          };
        }
        return filter;
      })
    );
  };

  const updateFilterRow = (filterId: string, rowId: string, field: keyof FilterRow, value: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            filterRows: filter.filterRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
          };
        }
        return filter;
      })
    );
  };

  const deleteFilterRow = (filterId: string, rowId: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            filterRows: filter.filterRows.filter((row) => row.id !== rowId),
          };
        }
        return filter;
      })
    );
  };

  const addMapping = (filterId: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            mappings: [
              ...filter.mappings,
              {
                ...INITIAL_MAPPING,
                id: (filter.mappings.length + 1).toString(),
              },
            ],
          };
        }
        return filter;
      })
    );
  };

  const updateMapping = (filterId: string, mappingId: string, field: keyof Mapping, value: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            mappings: filter.mappings.map((mapping) =>
              mapping.id === mappingId ? { ...mapping, [field]: value } : mapping
            ),
          };
        }
        return filter;
      })
    );
  };

  const addTransform = (filterId: string, mappingId: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            mappings: filter.mappings.map((mapping) => {
              if (mapping.id === mappingId) {
                return {
                  ...mapping,
                  transforms: [
                    ...mapping.transforms,
                    {
                      ...INITIAL_TRANSFORM,
                      id: (mapping.transforms.length + 1).toString(),
                    },
                  ],
                };
              }
              return mapping;
            }),
          };
        }
        return filter;
      })
    );
  };

  const updateTransform = (
    filterId: string,
    mappingId: string,
    transformId: string,
    field: keyof Transform,
    value: string
  ) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            mappings: filter.mappings.map((mapping) => {
              if (mapping.id === mappingId) {
                return {
                  ...mapping,
                  transforms: mapping.transforms.map((transform) =>
                    transform.id === transformId ? { ...transform, [field]: value } : transform
                  ),
                };
              }
              return mapping;
            }),
          };
        }
        return filter;
      })
    );
  };

  const deleteMapping = (filterId: string, mappingId: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            mappings: filter.mappings.filter((m) => m.id !== mappingId),
          };
        }
        return filter;
      })
    );
  };

  const deleteTransform = (filterId: string, mappingId: string, transformId: string) => {
    setFilters((current) =>
      current.map((filter) => {
        if (filter.id === filterId) {
          return {
            ...filter,
            mappings: filter.mappings.map((mapping) => {
              if (mapping.id === mappingId) {
                return {
                  ...mapping,
                  transforms: mapping.transforms.filter((t) => t.id !== transformId),
                };
              }
              return mapping;
            }),
          };
        }
        return filter;
      })
    );
  };

  // Generate the bot code as a string with unrolled logic
  const generateBotCode = useCallback(() => {
    const code = `import { Hl7Message } from '@medplum/core';

/**
 * Gets a value from an HL7 message based on a path
 * @param message The HL7 message
 * @param path The path in format "SEGMENT.FIELD[.COMPONENT]"
 * @returns The value at the specified path
 */
function getHL7Value(message: Hl7Message, path: string): string {
  // Split the path into segment and field parts (e.g., "OBX.7" -> ["OBX", "7"])
  const [segmentId, ...parts] = path.split('.');
  const fieldPath = parts.join('.');
  
  // Get the segment
  const segment = message.getSegment(segmentId);
  if (!segment) {
    return '';
  }

  // If no field specified, return the whole segment
  if (!fieldPath) {
    return segment.toString();
  }

  // Split field path for nested components (e.g., "5.1" -> ["5", "1"])
  const fieldParts = fieldPath.split('.');
  const fieldIndex = Number.parseInt(fieldParts[0]);
  
  // Get the field
  const field = segment.getField(fieldIndex);
  if (!field) {
    return '';
  }

  // Get the component if specified
  return fieldParts.length > 1 ? field.getComponent(Number.parseInt(fieldParts[1])) : field.toString();
}

/**
 * Sets a value in an HL7 message string based on a path
 * @param hl7String The HL7 message as a string
 * @param path The path in format "SEGMENT.FIELD[.COMPONENT]"
 * @param value The value to set
 * @returns The updated HL7 message string
 */
function setHL7ValueInString(hl7String: string, path: string, value: string): string {
  // Split the path into segment and field parts (e.g., "OBX.7" -> ["OBX", "7"])
  const [segmentId, ...parts] = path.split('.');
  const fieldPath = parts.join('.');
  
  // Split message into lines and find target segment
  const lines = hl7String.split('\\n').map(line => line.trim());
  const segmentIndex = lines.findIndex(line => line.startsWith(\`\${segmentId}|\`));
  if (segmentIndex === -1 || !fieldPath) {
    return hl7String;
  }

  // Parse the field and component indices (1-based in HL7)
  const fieldParts = fieldPath.split('.');
  const fieldIndex = Number.parseInt(fieldParts[0]);
  const componentIndex = fieldParts.length > 1 ? Number.parseInt(fieldParts[1]) : null;
  
  // Split the segment into fields (separator is |)
  const fields = lines[segmentIndex].split('|');
  // MSH1 gets parsed out
  if (segmentId === 'MSH') {
    fields.splice(1, 0, '|');
  }

  if (componentIndex === null) {
    // Setting entire field
    fields[fieldIndex] = value;
  } else {
    // Setting specific component
    const components = fields[fieldIndex].split('^');
    
    // Pad components array if needed (accounting for 1-based indexing)
    while (components.length <= componentIndex) {
      components.push('');
    }
    
    components[componentIndex] = value;
    fields[fieldIndex] = components.join('^');
  }

  if (segmentId === 'MSH') {
    fields.splice(1, 1);
  }
  // Reconstruct the message
  lines[segmentIndex] = fields.join('|');
  return lines.join('\\n');
}

/**
 * Transforms an HL7 message using explicit filter logic
 * @param input The input HL7 message
 * @returns The transformed HL7 message
 */
export default function transform(input: Hl7Message): Hl7Message {
  let result = input;
  let messageString = result.toString();
  
${filters.map((filter, filterIndex) => {
  return `  // Filter ${filterIndex + 1}: ${filter.src || 'No source specified'}
  {
    const srcValue = getHL7Value(result, "${filter.src}");
    
    // Evaluate filter conditions
    const filterResult = ${filter.filterRows.map((row, rowIndex) => {
      let condition = '';
      
      switch(row.command) {
        case 'startsWith':
          condition = `srcValue.startsWith("${row.value}")`;
          break;
        case 'contains':
          condition = `srcValue.includes("${row.value}")`;
          break;
        case 'endsWith':
          condition = `srcValue.endsWith("${row.value}")`;
          break;
        case 'exact':
          condition = `srcValue === "${row.value}"`;
          break;
        default:
          condition = 'false';
      }
      
      if (rowIndex === 0) {
        return condition;
      } else {
        return `${row.operator === 'AND' ? '&&' : '||'} ${condition}`;
      }
    }).join(' ')};
    
    // Apply mappings if filter conditions match
    if (filterResult) {
${filter.mappings.map((mapping, mappingIndex) => {
  return `      // Mapping ${mappingIndex + 1}: ${mapping.src || 'No source'} -> ${mapping.dst || 'No destination'}
      {
        let currentValue = getHL7Value(result, "${mapping.src}");
        
${mapping.transforms.map((transform, transformIndex) => {
  let transformCode = '';
  
  switch(transform.command) {
    case 'replace':
      const args = transform.args.split(' ');
      if (args.length >= 2) {
        transformCode = `currentValue = currentValue.replace("${args[0]}", "${args[1]}");`;
      } else {
        transformCode = `// Invalid replace arguments: ${transform.args}`;
      }
      break;
    case 'addPrefix':
      transformCode = `currentValue = "${transform.args}" + currentValue;`;
      break;
    case 'removePrefix':
      transformCode = `if (currentValue.startsWith("${transform.args}")) {
          currentValue = currentValue.substring(${transform.args.length});
        }`;
      break;
    case 'addSuffix':
      transformCode = `currentValue = currentValue + "${transform.args}";`;
      break;
    case 'removeSuffix':
      transformCode = `if (currentValue.endsWith("${transform.args}")) {
          currentValue = currentValue.substring(0, currentValue.length - ${transform.args.length});
        }`;
      break;
    case 'passthrough':
      transformCode = `// Passthrough - no change`;
      break;
    default:
      transformCode = `// Unknown transform: ${transform.command}`;
  }
  
  return `        // Transform ${transformIndex + 1}: ${transform.command}
        ${transformCode}`;
}).join('\n')}
        
        // Set the transformed value to the destination
        messageString = setHL7ValueInString(messageString, "${mapping.dst}", currentValue);
        result = Hl7Message.parse(messageString);
      }`;
}).join('\n')}
    }
  }`;
}).join('\n\n')}
  
  return result;
}`;

    setGeneratedBotCode(code);
    return code;
  }, [filters]);

  // Function to dynamically import a string as a module
  const dynamicImport = useCallback(async (code: string) => {
    // @ts-ignore This is usually there but we have a fallback
    if (globalThis.URL.createObjectURL) {
      const blob = new Blob([code], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      try {
        const module = await import(/* @vite-ignore */ url);
        return module;
      } finally {
        URL.revokeObjectURL(url); // Clean up the URL
      }
    }
    
    // Fallback to data URL if createObjectURL is not available
    const base64Code = btoa(code);
    const dataUrl = `data:text/javascript;base64,${base64Code}`;
    return import(/* @vite-ignore */ dataUrl);
  }, []);

  const transform = useCallback(async () => {
    try {
      // First generate the bot code
      const botCode = generateBotCode();
      
      // Parse the input message
      const message = Hl7Message.parse(input);
      
      try {
        // Try to dynamically import the generated code
        const module = await dynamicImport(botCode);
        
        // Execute the transform function from the imported module
        if (module.default) {
          const transformedMessage = module.default(message);
          setOutput(transformedMessage.toString());
        } else {
          throw new Error('Module does not have a default export');
        }
      } catch (importError) {
        console.error('Error importing module:', importError);
        
        // Fallback to the original implementation
        const transformedMessage = applyTransforms(message, filters);
        setOutput(transformedMessage.toString());
        console.warn('Using fallback transform method');
      }
    } catch (error: unknown) {
      console.error('Error during transform:', error);
      // Show error in output
      setOutput(`Error during transform: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [input, filters, generateBotCode, dynamicImport]);

  const exportBot = () => {
    // Use the already generated bot code
    const botCode = generatedBotCode || generateBotCode();
    
    // Create a blob and save it
    const blob = new Blob([botCode], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'bot.ts');
  };

  return (
    <div style={{ height: "100vh" }}>
      <Drawer
        opened={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Message Templates"
        padding="md"
        size="sm"
      >
        <List spacing="xs">
          {templates.map((template, index) => (
            <List.Item
              key={index}
              onClick={() => selectMessageTemplate(index)}
              style={{ 
                cursor: 'pointer', 
                padding: '8px',
                backgroundColor: selectedMessageIndex === index ? '#f0f0f0' : 'transparent',
                borderRadius: '4px'
              }}
              icon={
                <ThemeIcon color={selectedMessageIndex === index ? "blue" : "gray"} size={24} radius="xl">
                  {selectedMessageIndex === index ? <IconCheck size={16} /> : <IconMessage size={16} />}
                </ThemeIcon>
              }
            >
              <Group justify="space-between" style={{ width: '100%' }}>
                <div>{template.name}</div>
                {/* Don't allow deleting the default templates */}
                {index >= DEFAULT_TEMPLATES.length && (
                  <ActionIcon 
                    color="red" 
                    variant="subtle" 
                    onClick={(e) => deleteTemplate(index, e)}
                    size="sm"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                )}
              </Group>
            </List.Item>
          ))}
        </List>
      </Drawer>

      <Stack gap="md">
        <Group justify="space-between" mb="md">
          <ActionIcon 
            onClick={() => setSidebarOpen(true)}
            size="lg"
            variant="light"
          >
            <IconMenu2 />
          </ActionIcon>
          <InputLabel size="lg">HL7 Mapper</InputLabel>
          <div></div> {/* Empty div for spacing */}
        </Group>

        <Group grow>
          <Stack>
            <Group>
              <TextInput
                placeholder="Template name"
                label="Name"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button 
                onClick={saveTemplate}
                leftSection={<IconDeviceFloppy size={16} />}
                style={{ marginTop: 'auto' }}
              >
                Save
              </Button>
            </Group>
            <Textarea
              autosize
              label="Input"
              resize="vertical"
              minRows={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <Textarea
              autosize
              label="Expected"
              resize="vertical"
              minRows={10}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </Stack>
          <Stack>
            <Button onClick={transform} my="sm">
              Transform
            </Button>
            <Button onClick={exportBot} my="sm" variant="outline">
              Export Bot
            </Button>
          </Stack>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Textarea autosize label="Actual Output" resize="vertical" minRows={10} readOnly value={output} />
            <InputLabel>Diff (Expected vs Actual)</InputLabel>
            <div
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              <DiffView actual={output} expected={expected} />
          </div>
          </Stack>
        </Group>

        <Divider my="md" size="sm" />

        <InputLabel size="sm">Filters</InputLabel>
        {filters.map((filter) => (
          <Stack key={filter.id} gap="xs">
            <Group justify="space-between">
              <Select
                label="Source Field"
                value={filter.src}
                onChange={(value) => updateFilterSource(filter.id, value || "")}
                data={HL7_SELECT_DATA}
                searchable
                clearable
                placeholder="Select source field"
                style={{ width: "300px" }}
              />
              <ActionIcon onClick={() => deleteFilter(filter.id)} color="red" variant="subtle">
                <IconTrash size={16} />
              </ActionIcon>
            </Group>

            <InputLabel size="sm">Filter Conditions</InputLabel>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Operator</Table.Th>
                  <Table.Th>Function</Table.Th>
                  <Table.Th>Value</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filter.filterRows.map((filterRow) => (
                  <React.Fragment key={filterRow.id}>
                    <Table.Tr>
                      <Table.Td>
                        <Select
                          value={filterRow.operator}
                          onChange={(value) => updateFilterRow(filter.id, filterRow.id, "operator", value || "AND")}
                          data={OPERATOR_OPTIONS}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Select
                          value={filterRow.command}
                          onChange={(value) => updateFilterRow(filter.id, filterRow.id, "command", value || "contains")}
                          data={FILTER_FUNCTION_OPTIONS}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          value={filterRow.value}
                          onChange={(e) => updateFilterRow(filter.id, filterRow.id, "value", e.target.value)}
                          placeholder="Filter value..."
                        />
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          onClick={() => deleteFilterRow(filter.id, filterRow.id)}
                          color="red"
                          disabled={filter.filterRows.length === 1}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  </React.Fragment>
                ))}
              </Table.Tbody>
            </Table>

            <Button
              onClick={() => addFilterRow(filter.id)}
              leftSection={<IconPlus size={16} />}
              variant="light"
              size="sm"
            >
              Add Filter Condition
            </Button>

            <InputLabel size="sm">Transformations</InputLabel>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Source</Table.Th>
                  <Table.Th>Destination</Table.Th>
                  <Table.Th>Function</Table.Th>
                  <Table.Th>Arguments</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filter.mappings.map((mapping) => (
                  <React.Fragment key={mapping.id}>
                    <Table.Tr>
                      <Table.Td>
                        <Select
                          value={mapping.src}
                          onChange={(value) => updateMapping(filter.id, mapping.id, "src", value || "")}
                          data={HL7_SELECT_DATA}
                          searchable
                          clearable
                          placeholder="Select source"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Select
                          value={mapping.dst}
                          onChange={(value) => updateMapping(filter.id, mapping.id, "dst", value || "")}
                          data={HL7_SELECT_DATA}
                          searchable
                          clearable
                          placeholder="Select destination"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Select
                          value={mapping.transforms[0].command}
                          onChange={(value) =>
                            updateTransform(
                              filter.id,
                              mapping.id,
                              mapping.transforms[0].id,
                              "command",
                              value || "replace"
                            )
                          }
                          data={TRANSFORM_FUNCTION_OPTIONS}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          value={mapping.transforms[0].args}
                          onChange={(e) =>
                            updateTransform(filter.id, mapping.id, mapping.transforms[0].id, "args", e.target.value)
                          }
                          placeholder="arg1 arg2"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Group>
                          <ActionIcon
                            onClick={() => deleteMapping(filter.id, mapping.id)}
                            color="red"
                            disabled={filter.mappings.length === 1}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                          <ActionIcon onClick={() => addTransform(filter.id, mapping.id)} color="blue">
                            <IconPlus size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                    {mapping.transforms.slice(1).map((transform) => (
                      <Table.Tr key={transform.id}>
                        <Table.Td colSpan={2} />
                        <Table.Td>
                          <Select
                            value={transform.command}
                            onChange={(value) =>
                              updateTransform(filter.id, mapping.id, transform.id, "command", value || "replace")
                            }
                            data={TRANSFORM_FUNCTION_OPTIONS}
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            value={transform.args}
                            onChange={(e) =>
                              updateTransform(filter.id, mapping.id, transform.id, "args", e.target.value)
                            }
                            placeholder="arg1 arg2"
                          />
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            onClick={() => deleteTransform(filter.id, mapping.id, transform.id)}
                            color="red"
                            disabled={filter.mappings.length === 1}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </React.Fragment>
                ))}
              </Table.Tbody>
            </Table>

            <Button
              onClick={() => addMapping(filter.id)}
              leftSection={<IconPlus size={16} />}
              variant="light"
              size="sm"
            >
              Add Mapping
            </Button>
          </Stack>
        ))}

        <Button onClick={addFilter} leftSection={<IconPlus size={16} />} variant="outline">
          Add Filter
        </Button>
      </Stack>
    </div>
  );
}
