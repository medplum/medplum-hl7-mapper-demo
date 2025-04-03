# ORU^R01 Message Structure and Components

## Message Header (MSH)

Required segment containing routing and message type information.

- MSH-1: Field Separator (Required)
- MSH-2: Encoding Characters (Required)
- MSH-3: Sending Application (Optional)
- MSH-4: Sending Facility (Optional)
- MSH-5: Receiving Application (Optional)
- MSH-6: Receiving Facility (Optional)
- MSH-7: Date/Time of Message (Required)
- MSH-9: Message Type (Required)
  - MSH-9.1: Message Code (Required)
  - MSH-9.2: Trigger Event (Required)
  - MSH-9.3: Message Structure (Optional)
- MSH-10: Message Control ID (Required)
- MSH-11: Processing ID (Required)
- MSH-12: Version ID (Required)

## Patient Information (PID)

Required segment containing patient demographic data.

- PID-1: Set ID - PID (Optional)
- PID-2: Patient ID (Deprecated)
- PID-3: Patient Identifier List (Required)
  - PID-3.1: ID Number (Required)
  - PID-3.2: Check Digit (Optional)
  - PID-3.3: Check Digit Scheme (Optional)
  - PID-3.4: Assigning Authority (Optional)
  - PID-3.5: Identifier Type Code (Optional)
- PID-4: Alternate Patient ID (Optional)
- PID-5: Patient Name (Required)
  - PID-5.1: Family Name (Required)
  - PID-5.2: Given Name (Optional)
  - PID-5.3: Middle Name (Optional)
  - PID-5.4: Suffix (Optional)
  - PID-5.5: Prefix (Optional)
- PID-7: Date/Time of Birth (Optional)
- PID-8: Administrative Sex (Optional)
- PID-11: Patient Address (Optional)
  - PID-11.1: Street Address (Optional)
  - PID-11.2: Other Designation (Optional)
  - PID-11.3: City (Optional)
  - PID-11.4: State/Province (Optional)
  - PID-11.5: ZIP/Postal Code (Optional)
  - PID-11.6: Country (Optional)

## Observation Request (OBR)

Required segment containing order information.

- OBR-1: Set ID - OBR (Required)
- OBR-2: Placer Order Number (Optional)
- OBR-3: Filler Order Number (Optional)
- OBR-4: Universal Service ID (Required)
  - OBR-4.1: Identifier (Required)
  - OBR-4.2: Text (Optional)
  - OBR-4.3: Name of Coding System (Optional)
- OBR-7: Observation Date/Time (Optional)
- OBR-8: Observation End Date/Time (Optional)
- OBR-16: Ordering Provider (Optional)
  - OBR-16.1: ID Number (Optional)
  - OBR-16.2: Family Name (Optional)
  - OBR-16.3: Given Name (Optional)
- OBR-22: Results Rpt/Status Chng - Date/Time (Optional)
- OBR-25: Result Status (Required)

## Observation/Result (OBX)

Optional segment containing the actual results.

- OBX-1: Set ID - OBX (Required)
- OBX-2: Value Type (Required)
- OBX-3: Observation Identifier (Required)
  - OBX-3.1: Identifier (Required)
  - OBX-3.2: Text (Optional)
  - OBX-3.3: Name of Coding System (Optional)
- OBX-4: Observation Sub-ID (Optional)
- OBX-5: Observation Value (Optional)
- OBX-6: Units (Optional)
  - OBX-6.1: Identifier (Optional)
  - OBX-6.2: Text (Optional)
  - OBX-6.3: Name of Coding System (Optional)
- OBX-7: References Range (Optional)
- OBX-8: Abnormal Flags (Optional)
- OBX-11: Observation Result Status (Required)
- OBX-14: Date/Time of the Observation (Optional)

## Notes and Comments (NTE)

Optional segment for additional notes.

- NTE-1: Set ID - NTE (Optional)
- NTE-2: Source of Comment (Optional)
- NTE-3: Comment (Optional)
- NTE-4: Comment Type (Optional)

## Specimen Information (SPM)

Optional segment containing specimen details.

- SPM-1: Set ID - SPM (Optional)
- SPM-2: Specimen ID (Optional)
  - SPM-2.1: Container Identifier (Optional)
  - SPM-2.2: Position in Container (Optional)
- SPM-3: Specimen Parent IDs (Optional)
- SPM-4: Specimen Type (Required)
  - SPM-4.1: Identifier (Required)
  - SPM-4.2: Text (Optional)
  - SPM-4.3: Name of Coding System (Optional)
- SPM-17: Specimen Collection Date/Time (Optional)
- SPM-18: Specimen Received Date/Time (Optional)

## Common Order (ORC)

Optional segment containing order control information.

- ORC-1: Order Control (Required)
- ORC-2: Placer Order Number (Optional)
- ORC-3: Filler Order Number (Optional)
- ORC-4: Placer Group Number (Optional)
- ORC-5: Order Status (Optional)
- ORC-9: Date/Time of Transaction (Optional)
- ORC-12: Ordering Provider (Optional)
  - ORC-12.1: ID Number (Optional)
  - ORC-12.2: Family Name (Optional)
  - ORC-12.3: Given Name (Optional)

## Additional Notes:

1. Components marked as "Required" must be present in the segment
2. Components marked as "Optional" may be omitted based on implementation needs
3. Some fields contain multiple components, separated by component separators (usually ^)
4. Sub-components are separated by sub-component separators (usually &)
5. Field values must conform to the specified data types in the HL7 standard
6. The actual requirements may vary based on specific implementation guides or local specifications
