import { Button, Textarea, Group, Stack, Table, TextInput, Select, ActionIcon, InputLabel } from "@mantine/core";
import { Hl7Message } from "@medplum/core";
import { useCallback, useEffect, useState } from "react";
import { IconArrowUp, IconArrowDown, IconTrash, IconPlus } from "@tabler/icons-react";
import React from "react";

const oru = Hl7Message.parse(`MSH|^~\\&|MESA_RPT_MGR|EAST_RADIOLOGY|iFW|XYZ|||ORU^R01|MESA3b|P|2.4||||||||
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
    "ORC-12.3": "Given Name"
};
// List all the segments in the ORU^R01 message in the HL7v2.5 format from the internet and put them in an array

    
// Create a react component that will take in the oru message and display it in a content editable div
// Use mantine components where possible
// Hardcode one box to hold message (oru)
// Transform button
/// Another box
// onClick transform button, call transform fn
// transform(input, transformChain, output)

function getHL7Value(message: Hl7Message, path: string): string {
    // Split the path into segment and field parts (e.g., "OBX-7" -> ["OBX", "7"])
    const [segmentId, fieldPath] = path.split('-');
    
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
    const [fieldIndex, ...componentIndices] = fieldPath.split('.');
    
    // Get the field
    const field = segment.getField(parseInt(fieldIndex));
    if (!field) {
        return '';
    }

    // Get the component if specified
    return componentIndices.length > 0 ? field.getComponent(parseInt(componentIndices[0])) : field.toString();
}

type OperatorType = 'AND' | 'OR';
type FilterCommandType = 'startsWith' | 'contains' | 'endsWith' | 'exact';
type TransformType = 'replace';

interface TransformRow {
  id: string;
  src: string;
  dst: string;
  command: TransformType;
  args: string;
}

interface FilterRow {
  id: string;
  operator: OperatorType;
  command: FilterCommandType;
  value: string;
  transforms: TransformRow[];
}

interface Filter {
  id: string;
  src: string;
  filterRows: FilterRow[];
}

const INITIAL_TRANSFORM_ROW: TransformRow = {
  id: '1',
  src: '',
  dst: '',
  command: 'replace',
  args: ''
};

const INITIAL_FILTER_ROW: FilterRow = {
  id: '1',
  operator: 'AND',
  command: 'contains',
  value: '',
  transforms: [INITIAL_TRANSFORM_ROW]
};

const INITIAL_FILTER: Filter = {
  id: '1',
  src: '',
  filterRows: [INITIAL_FILTER_ROW]
};

const OPERATOR_OPTIONS = [
  { value: 'AND', label: 'AND' },
  { value: 'OR', label: 'OR' }
];

const FILTER_COMMAND_OPTIONS = [
  { value: 'startsWith', label: 'Starts With' },
  { value: 'contains', label: 'Contains' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'exact', label: 'Exact Match' }
];

const TRANSFORM_COMMAND_OPTIONS = [
  { value: 'replace', label: 'Replace' }
  // Add more commands as needed
];

// Add this helper to convert HL7_LABELS to Select data format
const HL7_SELECT_DATA = Object.entries(HL7_LABELS).map(([key, label]) => ({
  value: key,
  label: `${key} - ${label}`
}));

function setHL7ValueInString(hl7String: string, path: string, value: string): string {
    // Split the path into segment and field parts (e.g., "OBX-7" -> ["OBX", "7"])
    const [segmentId, fieldPath] = path.split('-');
    
    // Split message into lines and find target segment
    const lines = hl7String.split('\n').map(line => line.trim());
    const segmentIndex = lines.findIndex(line => line.startsWith(segmentId + '|'));
    if (segmentIndex === -1 || !fieldPath) {
        return hl7String;
    }

    // Parse the field and component indices (1-based in HL7)
    const [fieldStr, componentStr] = fieldPath.split('.');
    const fieldIndex = parseInt(fieldStr);
    const componentIndex = componentStr ? parseInt(componentStr) : null;
    
    // Split the segment into fields (separator is |)
    let fields = lines[segmentIndex].split('|');
    // MSH1 gets parsed out
    if (segmentId === 'MSH') {
        fields.splice(1, 0, '|');
    }

    if (componentIndex === null) {
        // Setting entire field
        fields[fieldIndex] = value;
    } else {
        // Setting specific component
        let components = fields[fieldIndex].split('^');
        
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
    return lines.join('\n');
}

export function AppMain() {
    const [input, setInput] = useState(oru.toString());
    const [output, setOutput] = useState(oru.toString());
    const [filters, setFilters] = useState<Filter[]>([INITIAL_FILTER]);

    const addFilter = () => {
        setFilters(current => [...current, {
            ...INITIAL_FILTER,
            id: (current.length + 1).toString()
        }]);
    };

    const deleteFilter = (filterId: string) => {
        setFilters(current => current.filter(f => f.id !== filterId));
    };

    const updateFilterSource = (filterId: string, src: string) => {
        setFilters(current =>
            current.map(filter =>
                filter.id === filterId ? { ...filter, src } : filter
            )
        );
    };

    const addFilterRow = (filterId: string) => {
        setFilters(current =>
            current.map(filter => {
                if (filter.id === filterId) {
                    return {
                        ...filter,
                        filterRows: [...filter.filterRows, {
                            ...INITIAL_FILTER_ROW,
                            id: (filter.filterRows.length + 1).toString()
                        }]
                    };
                }
                return filter;
            })
        );
    };

    const updateFilterRow = (filterId: string, rowId: string, field: keyof FilterRow, value: string) => {
        setFilters(current =>
            current.map(filter => {
                if (filter.id === filterId) {
                    return {
                        ...filter,
                        filterRows: filter.filterRows.map(row =>
                            row.id === rowId ? { ...row, [field]: value } : row
                        )
                    };
                }
                return filter;
            })
        );
    };

    const deleteFilterRow = (filterId: string, rowId: string) => {
        setFilters(current =>
            current.map(filter => {
                if (filter.id === filterId) {
                    return {
                        ...filter,
                        filterRows: filter.filterRows.filter(row => row.id !== rowId)
                    };
                }
                return filter;
            })
        );
    };

    const addTransform = (filterId: string, filterRowId: string) => {
        setFilters(current =>
            current.map(filter => {
                if (filter.id === filterId) {
                    return {
                        ...filter,
                        filterRows: filter.filterRows.map(row => {
                            if (row.id === filterRowId) {
                                return {
                                    ...row,
                                    transforms: [...row.transforms, {
                                        ...INITIAL_TRANSFORM_ROW,
                                        id: (row.transforms.length + 1).toString()
                                    }]
                                };
                            }
                            return row;
                        })
                    };
                }
                return filter;
            })
        );
    };

    const updateTransform = (filterId: string, filterRowId: string, transformId: string, field: keyof TransformRow, value: string) => {
        setFilters(current =>
            current.map(filter => {
                if (filter.id === filterId) {
                    return {
                        ...filter,
                        filterRows: filter.filterRows.map(row => {
                            if (row.id === filterRowId) {
                                return {
                                    ...row,
                                    transforms: row.transforms.map(transform =>
                                        transform.id === transformId ? { ...transform, [field]: value } : transform
                                    )
                                };
                            }
                            return row;
                        })
                    };
                }
                return filter;
            })
        );
    };

    const deleteTransform = (filterId: string, filterRowId: string, transformId: string) => {
        setFilters(current =>
            current.map(filter => {
                if (filter.id === filterId) {
                    return {
                        ...filter,
                        filterRows: filter.filterRows.map(row => {
                            if (row.id === filterRowId) {
                                return {
                                    ...row,
                                    transforms: row.transforms.filter(t => t.id !== transformId)
                                };
                            }
                            return row;
                        })
                    };
                }
                return filter;
            })
        );
    };

    const transform = useCallback(() => {
        let message = Hl7Message.parse(input);
        
        // Apply filters and their associated transforms
        for (const filter of filters) {
            const srcValue = getHL7Value(message, filter.src);
            
            for (const filterRow of filter.filterRows) {
                const matches = (() => {
                    switch (filterRow.command) {
                        case 'startsWith':
                            return srcValue.startsWith(filterRow.value);
                        case 'contains':
                            return srcValue.includes(filterRow.value);
                        case 'endsWith':
                            return srcValue.endsWith(filterRow.value);
                        case 'exact':
                            return srcValue === filterRow.value;
                        default:
                            return false;
                    }
                })();

                // If filter matches, apply its transforms
                if (matches) {
                    for (const transform of filterRow.transforms) {
                        const transformSrcValue = getHL7Value(message, transform.src);
                        const args = transform.args.split(' ');
                        
                        switch (transform.command) {
                            case 'replace':
                                message = Hl7Message.parse(setHL7ValueInString(
                                    message.toString(), 
                                    transform.dst, 
                                    transformSrcValue.replace(args[0], args[1])
                                ));
                                break;
                        }
                    }
                }
            }
        }
        
        setOutput(message.toString());
    }, [input, filters]);

    return (
        <div style={{ height: '100vh' }}>
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
                    <Button onClick={transform} my="sm">
                        Transform
                    </Button>
                    <Textarea
                        autosize
                        label="Output"
                        resize="vertical"
                        minRows={10}
                        readOnly
                        value={output}
                    />
                </Group>
                
                <InputLabel size="sm">Filters</InputLabel>
                {filters.map(filter => (
                    <Stack key={filter.id} gap="xs">
                        <Group justify="space-between">
                            <Select
                                label="Source Field"
                                value={filter.src}
                                onChange={(value) => updateFilterSource(filter.id, value || '')}
                                data={HL7_SELECT_DATA}
                                searchable
                                clearable
                                placeholder="Select source field"
                                style={{ width: '300px' }}
                            />
                            <ActionIcon 
                                onClick={() => deleteFilter(filter.id)}
                                color="red"
                                variant="subtle"
                            >
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
                                                    onChange={(value) => updateFilterRow(filter.id, filterRow.id, 'operator', value || 'AND')}
                                                    data={OPERATOR_OPTIONS}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <Select
                                                    value={filterRow.command}
                                                    onChange={(value) => updateFilterRow(filter.id, filterRow.id, 'command', value || 'contains')}
                                                    data={FILTER_COMMAND_OPTIONS}
                                                />
                                            </Table.Td>
                                            <Table.Td>
                                                <TextInput
                                                    value={filterRow.value}
                                                    onChange={(e) => updateFilterRow(filter.id, filterRow.id, 'value', e.target.value)}
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
                                        <Table.Tr>
                                            <Table.Td colSpan={4}>
                                                <Stack gap="xs" pl="xl">
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
                                                            {filterRow.transforms.map((transformRow) => (
                                                                <Table.Tr key={transformRow.id}>
                                                                    <Table.Td>
                                                                        <Select
                                                                            value={transformRow.src}
                                                                            onChange={(value) => updateTransform(filter.id, filterRow.id, transformRow.id, 'src', value || '')}
                                                                            data={HL7_SELECT_DATA}
                                                                            searchable
                                                                            clearable
                                                                            placeholder="Select source"
                                                                        />
                                                                    </Table.Td>
                                                                    <Table.Td>
                                                                        <Select
                                                                            value={transformRow.dst}
                                                                            onChange={(value) => updateTransform(filter.id, filterRow.id, transformRow.id, 'dst', value || '')}
                                                                            data={HL7_SELECT_DATA}
                                                                            searchable
                                                                            clearable
                                                                            placeholder="Select destination"
                                                                        />
                                                                    </Table.Td>
                                                                    <Table.Td>
                                                                        <Select
                                                                            value={transformRow.command}
                                                                            onChange={(value) => updateTransform(filter.id, filterRow.id, transformRow.id, 'command', value || 'replace')}
                                                                            data={TRANSFORM_COMMAND_OPTIONS}
                                                                        />
                                                                    </Table.Td>
                                                                    <Table.Td>
                                                                        <TextInput
                                                                            value={transformRow.args}
                                                                            onChange={(e) => updateTransform(filter.id, filterRow.id, transformRow.id, 'args', e.target.value)}
                                                                            placeholder="arg1 arg2"
                                                                        />
                                                                    </Table.Td>
                                                                    <Table.Td>
                                                                        <ActionIcon 
                                                                            onClick={() => deleteTransform(filter.id, filterRow.id, transformRow.id)}
                                                                            color="red"
                                                                            disabled={filterRow.transforms.length === 1}
                                                                        >
                                                                            <IconTrash size={16} />
                                                                        </ActionIcon>
                                                                    </Table.Td>
                                                                </Table.Tr>
                                                            ))}
                                                        </Table.Tbody>
                                                    </Table>
                                                    <Button 
                                                        onClick={() => addTransform(filter.id, filterRow.id)}
                                                        leftSection={<IconPlus size={16} />}
                                                        variant="light"
                                                        size="sm"
                                                    >
                                                        Add Transform
                                                    </Button>
                                                </Stack>
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
                    </Stack>
                ))}
                
                <Button 
                    onClick={addFilter}
                    leftSection={<IconPlus size={16} />}
                    variant="outline"
                >
                    Add Filter
                </Button>
            </Stack>
        </div>
    );
}
