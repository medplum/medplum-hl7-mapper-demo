import { DragDropContext, Draggable, DraggableLocation, DropResult, Droppable } from "@hello-pangea/dnd";
import { Group } from "@mantine/core";
import { Hl7Message } from "@medplum/core";
import { useState } from "react";
import "./App.css";
import { getAllPopulatedComponentsByName } from "./util/hl7";

const hl7Message = Hl7Message.parse(`MSH|^~\\&|REG|HMC|||202409061540||ADT^A08^ADT_A01|83271016|P|2.4|||AL|NE|
EVN|A08|202409061540||GenEdit|SPANENO^Paneno^Suzanna^L^^^^^^^^^XX|202409061540|
PID|1||M000241715^^^^MR^HMC~509-74-9378^^^^SS^HMC~E0-.M237102^^^^PI^HMC~E00142555^^^^EMR^HMC~FAF725CF-3FA0-4FE7-876B-F151EBDD6F0D^^^^PT^HMC||Gibble^Pamela^S^^^^L||19660827|F||WH|17033 Hwy 281^^Smith Center^KS^66967^USA^^^KS183||785-282-1256^PRN^CELL|(999)999-9999^WPN^EMP|ENG|M||V00071275531|509-74-9378|||NH|
NK1|1|Gibble^Ron|HU^Husband|17033 Hwy 281^^Smith Center^KS^66967|785-282-1243^PRN^CELL||PTN|
NK1|2|HOMEMAKER||-^^-^-^99999||(999)999-9999|EMP||||||Homemaker|
PV1|1|I|CPCU^2211^01|EL||CPCU^2211^01|MROBINSON^Robinson^Melanie^O^^^MD^^^^^^XX|MROBINSON^Robinson^Melanie^O^^^MD^^^^^^XX||MED||||PHY|||MROBINSON^Robinson^Melanie^O^^^MD^^^^^^XX|IN||CO|||||||||||||||||||HMC||ADM|||202409061525|
PV2|1|CPCU^Cardiac Progressive Care Unit^CPCU|chest pain||||||||1||||||||||||||EL|||||||||||N|
ROL|1|AD|PP|TWINDSCHE^Windscheffel^Tamara^^^^APRN^^^^^^XX|
ROL|2|AD|AD|MROBINSON^Robinson^Melanie^O^^^MD^^^^^^XX|
ROL|3|AD|AT|MROBINSON^Robinson^Melanie^O^^^MD^^^^^^XX|
ROL|4|AD|RP|MROBINSON^Robinson^Melanie^O^^^MD^^^^^^XX|
OBX|1|ST|1010.1^WEIGHT^CPT4||73.754119|kg|||||F|||202409061539|
OBX|2|ST|1010.3^HEIGHT^CPT4||162.56|cm|||||F|||202409061539|
AL1|1|DA|F001000491^Sulfa (Sulfonamide Antibiotics)^^Sulfa (Sulfonamide Antibiotics)^^allergy.id|U|unknown|20191209|
AL1|2|DA|F006001677^baclofen^^baclofen^^allergy.id|U|vomiting|20191209|
AL1|3|DA|F006002738^tetracycline^^tetracycline^^allergy.id|U|unknown|20191209|
DRG|41^Version 41^ICD10|
GT1|1||Gibble^Pamela^S||17033 Hwy 281^^Smith Center^KS^66967|785-282-1256^PRN^CELL|||||SP|509-74-9378||||HOMEMAKER|-^^-^-^99999|(999)999-9999^WPN^EMP|
IN1|1|AMBE||Ambetter Sunflower Health Plan|Attn: Claims^PO Box 5010^Farmington^MO^63640-5010||844-518-9505|||||20240906||||Gibble^Pamela^S|SP|19660827|17033 Hwy 281^^Smith Center^KS^66967|||||||||||||||||U9496426501|||||||F|-^^-^-^99999|||||U9496426501|
IN2|1|509-74-9378||||||||||||||||||||||||||||||||||||||||WH|M||||||||||||||||||||785-282-1256|
IN1|2|SP||Self Pay||||||||20240906|`);

const hl7Message2 = Hl7Message.parse(`MSH|^~\\&|REG|HMC|||202409101629||ADT^A04^ADT_A01|83442175|P|2.4|||AL|NE|
EVN|A04|202409101629||ENREGOUT|MARENIVAS^Arenivas^Marissa^E^^^^^^^^^XX|202409101628|
PID|1||M000208616^^^^MR^HMC~999-99-9999^^^^SS^HMC~E1-.M203289^^^^PI^HMC~E00106261^^^^EMR^HMC~82E25194-434E-48A8-8DF1-2D726C20B4AF^^^^PT^HMC||Brungardt^Trey^Carter^^^^L|Erin Lynn|20141125|M||WH|1602 Prairie Run Ct^^Hays^KS^67601^USA^^^KS051||785-623-8161^PRN^CELL|(999)999-9999^WPN^EMP|ENG|S|CA|V00071294375|999-99-9999|||NH|
NK1|1|Brungardt^Erin^Lynn|MO^Mother|1602 Prairie Run Ct^^Hays^KS^67601|785-623-8161^PRN^CELL||NOK|
NK1|2|Brungardt^James|FA^Father|1602 Prairie Run Ct^^Hays^KS^67601|785-735-4279^PRN^CELL||PTN|
NK1|3|MINOR||-^^-^-^99999||(999)999-9999|EMP|||Minor|||Minor|||||||||||||||||||||UE|
PV1|1|O|IMG.RAD|EL||IMG.RAD|TDEWITT2^DeWitt^Tiffany^M^^^APRN^^^^^^XX|TDEWITT2^DeWitt^Tiffany^M^^^APRN^^^^^^XX||||||PHY||||CLI||BC|||||||||||||||||||HMC||REG|||202409101628|
PV2|1||SOB||||||||||||||||||||||EL|||||||||||N|
ROL|1|AD|PP|NWERTH3^Werth^Natasha^^^^APRN^^^^^^XX|
ROL|2|AD|AT|TDEWITT2^DeWitt^Tiffany^M^^^APRN^^^^^^XX|
ROL|3|AD|RP|TDEWITT2^DeWitt^Tiffany^M^^^APRN^^^^^^XX|
AL1|1|DA|F001900590^No Known Drug Allergies^^No Known Drug Allergies^^allergy.id|U||20240715|
DG1|1||R06.02^Shortness of breath^I10|||W|
DRG|41^Version 41^ICD10|
GT1|1||Brungardt^Erin^Lynn||1602 Prairie Run Ct^^Hays^KS^67601|785-623-8161^PRN^CELL~785-623-5705^ORN^WORK|||||SO|515-92-8695||||HAYSMEDCEN|2220 Canterbury Dr^^Hays^KS^67601|785-623-5000^WPN^EMP|
IN1|1|BCBS.KS||BCBS - Kansas|1133 Sw Topeka Blvd^Po Box 239^Topeka^KS^66601-0239||800-432-3990|96725||||20240910||||Brungardt^James^F|SO|19860721|1602 Prairie Run Ct^^Hays^KS^67601|||||||||||||||||XSB832640177|||||||M||||||XSB832640177|
IN2|1|999-99-9999|||||||||||||||||||||||||||||||||||||||||M||||||||||||||||||||(785)623-8161|
IN1|2|SP||Self Pay||||||||20240910|`);

const oru = Hl7Message.parse(`MSH|^~\\&|MESA_RPT_MGR|EAST_RADIOLOGY|iFW|XYZ|||ORU^R01|MESA3b|P|2.4||||||||
PID|||CR3^^^ADT1||CRTHREE^PAUL|||||||||||||PatientAcct||||||||||||
PV1||1|CE||||12345^SMITH^BARON^H|||||||||||
OBR|||||||20010501141500.0000||||||||||||||||||F||||||||||||||||||
OBX|1|HD|SR Instance UID||1.113654.1.2001.30.2.1||||||F||||||
OBX|2|TX|SR Text||Radiology Report History Cough Findings PA evaluation of the chest demonstrates the lungs to be expanded and clear.  Conclusions Normal PA chest x-ray.||||||F||||||
`);


// Hardcode one box to hold message (oru)
// Transform button
/// Another box
// onClick transform button, call transform fn
// transform(input, transformChain, output)

function App() {
  const [segmentNames] = useState<string[]>(getAllPopulatedComponentsByName(hl7Message));
  const [fields, setFields] = useState<Record<string, string | undefined>>(
    Object.fromEntries(FIELDS.map((field) => [field, undefined]))
  );

  function handleOnDragEnd(result: DropResult) {
    if (result.destination === null || !result.destination.droppableId) {
      return;
    }
    setFields((s) => ({
      ...s,
      [(result.destination as DraggableLocation).droppableId]: result.draggableId,
    }));
  }

  return (
    <div className="App">
      <h1>HL7v2 to FHIR Mapper</h1>
      <div className="input-output"></div>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Group style={{ width: "100%" }} preventGrowOverflow justify="space-between" gap="xl" grow>
          <div className="characters">
            <Droppable key="segments" droppableId="segments">
              {(provided) => (
                <ul {...provided.droppableProps} ref={provided.innerRef}>
                  {segmentNames.map((name, index) => {
                    console.log(name);
                    return (
                      <Draggable key={name} draggableId={name} index={index}>
                        {(provided) => (
                          <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <p>{name}</p>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </div>
          <div className="fields">
            <ul>
              {Object.entries(fields).map(([name, mappedSegment]) => {
                return (
                  <Droppable key={name} droppableId={name}>
                    {(provided) => (
                      <li ref={provided.innerRef} {...provided.droppableProps}>
                        <p>
                          {name}: {mappedSegment ?? ""}
                        </p>
                      </li>
                    )}
                  </Droppable>
                );
              })}
            </ul>
          </div>
        </Group>
      </DragDropContext>
    </div>
  );
}

export default App;
