import { ActionIcon, Button, Group, InputLabel, Select, Stack, Table, TextInput, Textarea } from "@mantine/core";
import { Hl7Message } from "@medplum/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { diffChars } from "diff";
import React, { useCallback, useState } from "react";
import { Filter, FilterRow, Mapping, Transform, applyTransforms } from "./util/transform";
import { saveAs } from 'file-saver';

const oru = Hl7Message.parse(`MSH|^~\\&|MESA_RPT_MGR|EAST_RADIOLOGY|iFW|XYZ|||ORU^R01|MESA3b|P|2.4||||||||
    PID|||CR3^^^ADT1||CRTHREE^PAUL|||||||||||||PatientAcct||||||||||||
    PV1||1|CE||||12345^SMITH^BARON^H|||||||||||
    OBR|||||||20010501141500.0000||||||||||||||||||F||||||||||||||||||
    OBX|1|HD|SR Instance UID||1.113654.1.2001.30.2.1||||||F||||||
    OBX|2|TX|SR Text||Radiology Report History Cough Findings PA evaluation of the chest demonstrates the lungs to be expanded and clear.  Conclusions Normal PA chest x-ray.||||||F||||||
`);

const oruExpected = Hl7Message.parse(`MSH|^~\\&|mesa_RPT_MGR|EAST_radiology|iFW|XYZ|||ORU^R01|MESA3b|P|2.4||||||||
    PID|||CR3^^^ADT1||CRTHREE^PAUL|||||||||||||PatientAcct||||||||||||
    PV1||1|CE||||12345^SMITH^BARON^H|||||||||||
    OBR|||||||20010501141500.0000||||||||||||||||||F||||||||||||||||||
    OBX|1|HD|SR Instance UID||1.113654.1.2001.30.2.1||||||F||||||
    OBX|2|TX|SR Text||Radiology Report History Cough Findings PA evaluation of the chest demonstrates the lungs to be expanded and clear.  Conclusions Normal PA chest x-ray.||||||F||||||
`);

// TODO: Display each transform as a row
// Each row has dropdowns for src, dst, command, and args are freetext fields
// There is a button to add a new row
// There is a button to delete the selected row
// There is a button to move the selected row up
// There is a button to move the selected row down
// There is a button to move the selected row to the top
// There is a button to move the selected row to the bottom

const HL7_LABELS = {
  "MSH-1": "Field Separator",
  "MSH-2": "Encoding Characters",
  "MSH-3": "Sending Application",
  "MSH-4": "Sending Facility",
  "MSH-5": "Receiving Application",
  "MSH-6": "Receiving Facility",
  "MSH-7": "Date/Time of Message",
  "MSH-9": "Message Type",
  "MSH-9.1": "Message Code",
  "MSH-9.2": "Trigger Event",
  "MSH-9.3": "Message Structure",
  "MSH-10": "Message Control ID",
  "MSH-11": "Processing ID",
  "MSH-12": "Version ID",

  "PID-1": "Set ID - PID",
  "PID-2": "Patient ID",
  "PID-3": "Patient Identifier List",
  "PID-3.1": "ID Number",
  "PID-3.2": "Check Digit",
  "PID-3.3": "Check Digit Scheme",
  "PID-3.4": "Assigning Authority",
  "PID-3.5": "Identifier Type Code",
  "PID-4": "Alternate Patient ID",
  "PID-5": "Patient Name",
  "PID-5.1": "Family Name",
  "PID-5.2": "Given Name",
  "PID-5.3": "Middle Name",
  "PID-5.4": "Suffix",
  "PID-5.5": "Prefix",
  "PID-7": "Date/Time of Birth",
  "PID-8": "Administrative Sex",
  "PID-11": "Patient Address",
  "PID-11.1": "Street Address",
  "PID-11.2": "Other Designation",
  "PID-11.3": "City",
  "PID-11.4": "State/Province",
  "PID-11.5": "ZIP/Postal Code",
  "PID-11.6": "Country",

  "OBR-1": "Set ID - OBR",
  "OBR-2": "Placer Order Number",
  "OBR-3": "Filler Order Number",
  "OBR-4": "Universal Service ID",
  "OBR-4.1": "Identifier",
  "OBR-4.2": "Text",
  "OBR-4.3": "Name of Coding System",
  "OBR-7": "Observation Date/Time",
  "OBR-8": "Observation End Date/Time",
  "OBR-16": "Ordering Provider",
  "OBR-16.1": "ID Number",
  "OBR-16.2": "Family Name",
  "OBR-16.3": "Given Name",
  "OBR-22": "Results Rpt/Status Chng - Date/Time",
  "OBR-25": "Result Status",

  "OBX-1": "Set ID - OBX",
  "OBX-2": "Value Type",
  "OBX-3": "Observation Identifier",
  "OBX-3.1": "Identifier",
  "OBX-3.2": "Text",
  "OBX-3.3": "Name of Coding System",
  "OBX-4": "Observation Sub-ID",
  "OBX-5": "Observation Value",
  "OBX-6": "Units",
  "OBX-6.1": "Identifier",
  "OBX-6.2": "Text",
  "OBX-6.3": "Name of Coding System",
  "OBX-7": "References Range",
  "OBX-8": "Abnormal Flags",
  "OBX-11": "Observation Result Status",
  "OBX-14": "Date/Time of the Observation",

  "NTE-1": "Set ID - NTE",
  "NTE-2": "Source of Comment",
  "NTE-3": "Comment",
  "NTE-4": "Comment Type",

  "SPM-1": "Set ID - SPM",
  "SPM-2": "Specimen ID",
  "SPM-2.1": "Container Identifier",
  "SPM-2.2": "Position in Container",
  "SPM-3": "Specimen Parent IDs",
  "SPM-4": "Specimen Type",
  "SPM-4.1": "Identifier",
  "SPM-4.2": "Text",
  "SPM-4.3": "Name of Coding System",
  "SPM-17": "Specimen Collection Date/Time",
  "SPM-18": "Specimen Received Date/Time",

  "ORC-1": "Order Control",
  "ORC-2": "Placer Order Number",
  "ORC-3": "Filler Order Number",
  "ORC-4": "Placer Group Number",
  "ORC-5": "Order Status",
  "ORC-9": "Date/Time of Transaction",
  "ORC-12": "Ordering Provider",
  "ORC-12.1": "ID Number",
  "ORC-12.2": "Family Name",
  "ORC-12.3": "Given Name",
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

const FILTER_COMMAND_OPTIONS = [
  { value: "startsWith", label: "Starts With" },
  { value: "contains", label: "Contains" },
  { value: "endsWith", label: "Ends With" },
  { value: "exact", label: "Exact Match" },
];

const TRANSFORM_COMMAND_OPTIONS = [
  { value: "replace", label: "Replace" },
  { value: "passthrough", label: "Passthrough" },
  // Add more commands as needed
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

export function AppMain() {
  const [input, setInput] = useState(oru.toString());
  const [output, setOutput] = useState(oru.toString());
  const [expected, setExpected] = useState(oruExpected.toString());
  const [filters, setFilters] = useState<Filter[]>([INITIAL_FILTER]);

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

  const transform = useCallback(() => {
    let message = Hl7Message.parse(input);
    const transformedMessage = applyTransforms(message, filters);
    setOutput(transformedMessage.toString());
  }, [input, filters]);

  const exportBot = () => {
    // Create the bot.ts file content
    const filtersJson = JSON.stringify(filters, null, 2);
    
    const fileContent = `import { Hl7Message, applyTransforms } from '@medplum/hl7';

// Encoded filters from the UI
const FILTERS = ${filtersJson};

/**
 * Transforms an HL7 message using the configured filters
 * @param input The input HL7 message
 * @returns The transformed HL7 message
 */
export default function transform(input: Hl7Message): Hl7Message {
  return applyTransforms(input, FILTERS);
}
`;

    // Create a blob and save it
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'bot.ts');
  };

  return (
    <div style={{ height: "100vh" }}>
      <Stack gap="md">
        <Group grow>
          <Textarea
            autosize
            label="Input"
            resize="vertical"
            minRows={10}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Stack>
            <Button onClick={transform} my="sm">
              Transform
            </Button>
            <Button onClick={exportBot} my="sm" variant="outline">
              Export Bot
            </Button>
          </Stack>
          <Stack gap="xs" style={{ flex: 1 }}>
            <Textarea
              autosize
              label="Expected"
              resize="vertical"
              minRows={10}
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
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
                  <Table.Th>Command</Table.Th>
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
                          data={FILTER_COMMAND_OPTIONS}
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
                  <Table.Th>Command</Table.Th>
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
                          data={TRANSFORM_COMMAND_OPTIONS}
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
                            data={TRANSFORM_COMMAND_OPTIONS}
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
