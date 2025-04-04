import { Hl7Message } from '@medplum/core';

// Types from AppMain.tsx
export type OperatorType = 'AND' | 'OR';
export type FilterFunctionType = 'startsWith' | 'contains' | 'endsWith' | 'exact';
export type TransformFunctionType =
  | 'replace'
  | 'passthrough'
  | 'addPrefix'
  | 'removePrefix'
  | 'addSuffix'
  | 'removeSuffix';

export interface Transform {
  id: string;
  command: TransformFunctionType;
  args: string;
}

export interface Mapping {
  id: string;
  src: string;
  dst: string;
  transforms: Transform[];
}

export interface FilterRow {
  id: string;
  operator: OperatorType;
  command: FilterFunctionType;
  value: string;
}

export interface Filter {
  id: string;
  src: string;
  filterRows: FilterRow[];
  mappings: Mapping[];
}

/**
 * Gets a value from an HL7 message based on a path
 * @param message The HL7 message
 * @param path The path in format "SEGMENT.FIELD[.COMPONENT]"
 * @returns The value at the specified path
 */
export function getHL7Value(message: Hl7Message, path: string): string {
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
export function setHL7ValueInString(hl7String: string, path: string, value: string): string {
  // Split the path into segment and field parts (e.g., "OBX.7" -> ["OBX", "7"])
  const [segmentId, ...parts] = path.split('.');
  const fieldPath = parts.join('.');

  // Split message into lines and find target segment

  const lines = hl7String.split('\r').map((line) => line.trim());
  const segmentIndex = lines.findIndex((line) => line.startsWith(segmentId + '|'));
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
  return lines.join('\r');
}

/**
 * Applies a series of filters and transformations to an HL7 message
 * @param message The input HL7 message
 * @param filters Array of filters to apply
 * @returns The transformed HL7 message
 */
export function applyTransforms(message: Hl7Message, filters: Filter[]): Hl7Message {
  let result = message;

  for (const filter of filters) {
    const srcValue = getHL7Value(result, filter.src);

    // Evaluate all filter conditions together with their operators
    const filterMatches = (filterRow: FilterRow) => {
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
      return { matches, operator: filterRow.operator };
    };

    // Combine all conditions using their operators
    const filterResult = filter.filterRows.reduce((acc, filterRow, index) => {
      const { matches, operator } = filterMatches(filterRow);

      if (index === 0) return matches;
      return operator === 'AND' ? acc && matches : acc || matches;
    }, false);

    // If filter conditions match, apply all mappings
    if (filterResult) {
      for (const mapping of filter.mappings) {
        let currentValue = getHL7Value(result, mapping.src);

        // Apply each transform in sequence
        for (const transform of mapping.transforms) {
          switch (transform.command) {
            case 'replace': {
              const args = transform.args.split(' ');
              if (args.length >= 2) {
                currentValue = currentValue.replace(args[0], args[1]);
              }
              break;
            }
            case 'addPrefix': {
              currentValue = transform.args + currentValue;
              break;
            }
            case 'removePrefix': {
              if (currentValue.startsWith(transform.args)) {
                currentValue = currentValue.substring(transform.args.length);
              }
              break;
            }
            case 'addSuffix': {
              currentValue = currentValue + transform.args;
              break;
            }
            case 'removeSuffix': {
              if (currentValue.endsWith(transform.args)) {
                currentValue = currentValue.substring(0, currentValue.length - transform.args.length);
              }
              break;
            }
            case 'passthrough':
              break;
          }
        }

        // Set final transformed value to destination
        result = Hl7Message.parse(setHL7ValueInString(result.toString(), mapping.dst, currentValue));
      }
    }
  }

  return result;
}
