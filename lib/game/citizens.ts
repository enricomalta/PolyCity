import type {
  Citizen,
  CitizenEducation,
  CitizenLifeStage,
} from "@/types/city"

export function getCitizenLifeStage(
  age: number,
): CitizenLifeStage {
  if (age < 4) return "BABY"
  if (age < 12) return "CHILD"
  if (age < 18) return "TEEN"
  if (age < 65) return "ADULT"
  return "ELDERLY"
}

export function getCitizenEducation(
  age: number,
): CitizenEducation {
  if (age < 6) return "NONE"
  if (age < 12) return "ELEMENTARY"
  if (age < 18) return "HIGH_SCHOOL"
  return "NONE"
}

export function canCitizenWork(
  citizen: Citizen,
): boolean {
  return citizen.lifeStage === "ADULT"
}

export function canCitizenStudy(
  citizen: Citizen,
): boolean {
  return (
    citizen.lifeStage === "CHILD" ||
    citizen.lifeStage === "TEEN" ||
    citizen.lifeStage === "ADULT"
  )
}

export function isCitizenRetired(
  citizen: Citizen,
): boolean {
  return citizen.lifeStage === "ELDERLY"
}
export function createCitizen(
  id: string,
  name: string,
  age: number,
  homeBuildingId: string,
): Citizen {
  const lifeStage = getCitizenLifeStage(age)

  return {
    id,
    name,
    age,
    lifeStage,
    education: getCitizenEducation(age),
    homeBuildingId,
    employed: false,
    workState: "HOME",
  }
}

export function updateCitizenWorkStates(
  citizens: Citizen[],
  timeStage: number,
): Citizen[] {
  return citizens.map((citizen) => {
    if (
      citizen.lifeStage !== "ADULT" ||
      !citizen.employed ||
      !citizen.workplaceBuildingId
    ) {
      return {
        ...citizen,
        workState: "HOME",
      }
    }

    // DIA:
    // Só quem está realmente em casa começa uma nova ida ao trabalho.
    // Quem já está TO_HOME continua terminando a viagem.
    if (timeStage === 1) {
      if (citizen.workState === "HOME") {
        return {
          ...citizen,
          workState: "TO_WORK",
        }
      }

      return citizen
    }

    // NOITE:
    // Só quem já chegou ao trabalho começa o retorno.
    // Quem ainda está TO_WORK termina a viagem atual.
    if (citizen.workState === "WORK") {
      return {
        ...citizen,
        workState: "TO_HOME",
      }
    }

    return citizen
  })
}