import type { Hl7Message, Hl7Segment } from "@medplum/core";

export function getAllSegmentsByName(message: Hl7Message): Record<string, Hl7Segment[]> {
  const segments = {} as Record<string, Hl7Segment[]>;
  for (const segment of message.segments) {
    const { name } = segment;
    if (!segments[name]) {
      segments[name] = [];
    }
    segments[name].push(segment);
  }
  return segments;
}

export function getAllSegmentsNames(message: Hl7Message): string[] {
  const segmentNames = new Set<string>();
  for (const segment of message.segments) {
    segmentNames.add(segment.name);
  }
  return Array.from(segmentNames);
}

export function getAllPopulatedComponentsByName(message: Hl7Message): string[] {
  const allComponents = [] as string[];
  const segmentNames = getAllSegmentsNames(message);
  for (const name of segmentNames) {
    const segment = message.getSegment(name);
    if (!segment) {
      continue;
    }
    const numFields = segment?.fields?.length ?? 0;
    for (let i = 0; i < numFields; i++) {
      const components = segment.fields[i].components;
      for (let j = 0; j < components.length; j++) {
        if (components[j]) {
          allComponents.push(`${name}${i}.${j}`);
        }
      }
    }
  }
  return allComponents;
}
