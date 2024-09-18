import { Result } from 'glpk.js'
import { VarsNames } from './config'
import { Input } from './input-validation'

type ResultData = Pick<Result['result'], 'vars' | 'z'>
export type Output = {
  lucro: number
  funcionariosContratados: string[]
  escala: {
    [dia: string]: {
      [turno: string]: {
        aula?: {
          nome: string
          funcionariosMinistram?: string[]
          professorContratado?: boolean
        }
        funcionariosAlocados: string[]
      }
    }
  }
}

export const transformResult = ({ vars, z }: ResultData, input: Input) => {
  const output: Output = {
    lucro: z,
    funcionariosContratados: [],
    escala: {}
  }

  const getFuncionarioName = (index: number | string) => input.funcionarios[+index]?.nome || `índice:${index}`
  const getEscalaObj = (dia: number | string, turno: number | string) =>
    output.escala[`dia ${+dia + 1}`][`turno ${+turno + 1}`]
  for (let i = 1; i <= input.dias; i++) {
    output.escala[`dia ${i}`] = {}
    for (let j = 1; j <= input.turnos.length; j++)
      output.escala[`dia ${i}`][`turno ${j}`] = { funcionariosAlocados: [] }
  }

  Object.entries(vars)
    .filter(entry => !!entry[1])
    .forEach(([name]) => {
      const [varName, ...index] = name.split(':')
      if (varName === VarsNames.CONTRATADO) output.funcionariosContratados.push(getFuncionarioName(index[0]))
      else if (varName === VarsNames.ALOCADO) {
        const [idFuncionario, dia, idTurno] = index
        getEscalaObj(dia, idTurno).funcionariosAlocados.push(getFuncionarioName(idFuncionario))
      } else if (varName === VarsNames.MINISTRA) {
        const [idFuncionario, idAula, dia, idTurno] = index
        const escala = getEscalaObj(dia, idTurno)
        escala.aula ??= { nome: input.aulas[+idAula].nome }
        escala.aula.funcionariosMinistram ??= []
        escala.aula.funcionariosMinistram.push(getFuncionarioName(idFuncionario))
      } else if (varName === VarsNames.PROFESSOR_CONTRATADO) {
        const [idAula, dia, idTurno] = index
        const escala = getEscalaObj(dia, idTurno)
        escala.aula ??= { nome: input.aulas[+idAula].nome }
        escala.aula.professorContratado = true
      }
    })
  return output
}
