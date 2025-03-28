import { Input } from './input-validation'
import { LP, GLPK } from 'glpk.js'
import {
  TEMPO_POR_TURNO,
  RELACAO_EXPERIENTE,
  TEMPO_POR_AULA,
  AULAS_SIMULTANEAS,
  AULAS_REPETIDAS_DIARIAS,
  VarsNames,
  TEMPO_MAXIMO_DIARIO,
  MAXIMO_TURNOS_CONSECUTIVOS
} from './config'

type Problem = {
  objective: LP['objective']['vars']
  subjectTo: LP['subjectTo']
  integerVars?: LP['generals']
  binaryVars?: LP['binaries']
}
type Vars = Problem['subjectTo'][number]['vars']

const pushReturn = <T>(value: T, arr: T[]): T => {
  arr.push(value)
  return value
}

export const createProblem = (data: Input, glpk: GLPK): Problem => {
  const dias = [...new Array(data.dias).keys()]
  // função objetivo
  const objective = data.funcionarios.map((funcionario, id) => ({
    name: `${VarsNames.CONTRATADO}:${id}`,
    coef: -1 * funcionario.salario
  }))
  dias.forEach(dia => {
    data.turnos.forEach((_, idTurno) => {
      data.aulas.forEach((aula, idAula) => {
        objective.push({
          name: `${VarsNames.AULA}:${idAula}:${dia}:${idTurno}`,
          coef: aula.precoPorAluno * aula.alunosEsperados
        })
        if (aula.custoProfessor > 0)
          objective.push({
            name: `${VarsNames.PROFESSOR_CONTRATADO}:${idAula}:${dia}:${idTurno}`,
            coef: -1 * aula.custoProfessor
          })
      })
    })
  })
  objective.sort((a, b) => a.name.localeCompare(b.name))

  const subjectTo: Problem['subjectTo'] = []
  const binaryVars: Problem['binaryVars'] = []

  // Mínimo de funcionários por turno
  dias.forEach(dia => {
    data.turnos.forEach((turno, idTurno) => {
      subjectTo.push({
        name: `minimo-funcionarios:${dia}:${idTurno}`,
        vars: data.funcionarios.map((_, idFuncionario) => ({
          name: pushReturn(`${VarsNames.ALOCADO}:${idFuncionario}:${dia}:${idTurno}`, binaryVars),
          coef: 1
        })),
        bnds: { type: glpk.GLP_LO, lb: turno, ub: data.funcionarios.length }
      })
    })
  })

  // Máximo de tempo de trabalho semanal por funcionário
  data.funcionarios.forEach((funcionario, idFuncionario) => {
    const vars: Vars = []
    dias.forEach(dia => {
      data.turnos.forEach((_, idTurno) => {
        vars.push({
          name: `${VarsNames.ALOCADO}:${idFuncionario}:${dia}:${idTurno}`,
          coef: TEMPO_POR_TURNO
        })
        data.aulas.forEach((_, idAula) => {
          vars.push({
            name: pushReturn(`${VarsNames.MINISTRA}:${idFuncionario}:${idAula}:${dia}:${idTurno}`, binaryVars),
            coef: TEMPO_POR_AULA
          })
        })
      })
    })
    vars.push({
      name: pushReturn(`${VarsNames.CONTRATADO}:${idFuncionario}`, binaryVars),
      coef: -1 * funcionario.tempoMaximo
    })
    subjectTo.push({
      name: `tempoMaximo:${idFuncionario}`,
      bnds: { type: glpk.GLP_UP, ub: 0, lb: -Infinity },
      vars
    })
  })

  // Máximo de tempo de trabalho diário por funcionário
  data.funcionarios.forEach((_, idFuncionario) => {
    dias.forEach(dia => {
      const vars: Vars = []
      data.turnos.forEach((_, idTurno) => {
        vars.push({
          name: `${VarsNames.ALOCADO}:${idFuncionario}:${dia}:${idTurno}`,
          coef: TEMPO_POR_TURNO
        })
        data.aulas.forEach((_, idAula) => {
          vars.push({
            name: `${VarsNames.MINISTRA}:${idFuncionario}:${idAula}:${dia}:${idTurno}`,
            coef: TEMPO_POR_AULA
          })
        })
      })
      subjectTo.push({
        name: `tempo-maximo-diario:${idFuncionario}:${dia}`,
        bnds: { type: glpk.GLP_UP, ub: TEMPO_MAXIMO_DIARIO, lb: 0 },
        vars
      })
    })
  })

  // // Máximo turnos consecutivos
  dias.forEach(dia => {
    data.funcionarios.forEach((funcionario, idFuncionario) => {
      for (let i = 0; i < data.turnos.length - MAXIMO_TURNOS_CONSECUTIVOS + 1; i++) {
        const vars: Vars = []
        for (let j = 0; j < MAXIMO_TURNOS_CONSECUTIVOS + 1; j++) {
          vars.push({
            name: `${VarsNames.ALOCADO}:${idFuncionario}:${dia}:${i + j}`,
            coef: 1
          })
          data.aulas
            .filter(aula => funcionario.aulas.includes(aula.nome))
            .forEach((_, idAula) => {
              vars.push({
                name: `${VarsNames.MINISTRA}:${idFuncionario}:${idAula}:${dia}:${i + j}`,
                coef: 1
              })
            })
        }
        subjectTo.push({
          name: `maximo-turnos-consecutivos:${idFuncionario}:${dia}:${i}`,
          vars,
          bnds: { type: glpk.GLP_UP, ub: MAXIMO_TURNOS_CONSECUTIVOS, lb: 0 }
        })
      }
    })
  })

  // Mínimo de funcionários experientes por turno
  dias.forEach(dia => {
    data.turnos.forEach((turno, idTurno) => {
      subjectTo.push({
        name: `experiencia:${dia}:${idTurno}`,
        vars: data.funcionarios
          .filter(funcionario => funcionario.experiente)
          .map((_, idFuncionario) => ({
            name: `${VarsNames.ALOCADO}:${idFuncionario}:${dia}:${idTurno}`,
            coef: 1
          })),
        bnds: {
          type: glpk.GLP_LO,
          ub: data.funcionarios.length,
          lb: turno * (RELACAO_EXPERIENTE / 100)
        }
      })
    })
  })

  // Funcionário fornece aula ou é escalado
  data.funcionarios.forEach((_, idFuncionario) => {
    dias.forEach(dia => {
      data.turnos.forEach((_, idTurno) => {
        subjectTo.push({
          name: `ministra-ou-alocado:${idFuncionario}:${dia}:${idTurno}`,
          vars: [
            {
              name: `${VarsNames.ALOCADO}:${idFuncionario}:${dia}:${idTurno}`,
              coef: 1
            }
          ].concat(
            data.aulas.map((_, idAula) => ({
              name: `${VarsNames.MINISTRA}:${idFuncionario}:${idAula}:${dia}:${idTurno}`,
              coef: 1
            }))
          ),
          bnds: { type: glpk.GLP_UP, ub: 1, lb: 0 }
        })
      })
    })
  })

  // aulas simultaneas
  dias.forEach(dia => {
    data.turnos.forEach((_, idTurno) => {
      subjectTo.push({
        name: `aulas-simultaneas:${dia}:${idTurno}`,
        vars: data.aulas.map((_, idAula) => ({
          name: pushReturn(`${VarsNames.AULA}:${idAula}:${dia}:${idTurno}`, binaryVars),
          coef: 1
        })),
        bnds: { type: glpk.GLP_UP, ub: AULAS_SIMULTANEAS, lb: 0 }
      })
    })
  })

  // Mínimo de aulas por semana
  data.aulas
    .filter(aula => aula.minimoSemanal > 0)
    .forEach((aula, idAula) => {
      const vars: Vars = []
      dias.forEach(dia => {
        data.turnos.forEach((_, idTurno) => {
          vars.push({
            name: `${VarsNames.AULA}:${idAula}:${dia}:${idTurno}`,
            coef: 1
          })
        })
      })
      subjectTo.push({
        name: `aula-obrigatoria:${idAula}`,
        vars,
        bnds: { type: glpk.GLP_LO, lb: aula.minimoSemanal, ub: data.turnos.length * dias.length }
      })
    })

  // Turnos sem aula
  data.aulas.forEach((_, idAula) => {
    dias.forEach(dia => {
      subjectTo.push({
        name: `turno-sem-aula:${idAula}:${dia}`,
        bnds: { type: glpk.GLP_FX, lb: 0, ub: 0 },
        vars: data.turnosSemAula.map(idTurno => ({
          name: `${VarsNames.AULA}:${idAula}:${dia}:${idTurno - 1}`,
          coef: 1
        }))
      })
    })
  })

  // Limite de 2 aulas iguais por dia
  dias.forEach(dia => {
    data.aulas.forEach((_, idAula) => {
      subjectTo.push({
        name: `maximo-aulas-por-dia:${idAula}:${dia}`,
        vars: data.turnos.map((_, idTurno) => ({
          name: `${VarsNames.AULA}:${idAula}:${dia}:${idTurno}`,
          coef: 1
        })),
        bnds: { type: glpk.GLP_UP, ub: AULAS_REPETIDAS_DIARIAS, lb: 0 }
      })
    })
  })

  // Funcionarios ministram se aula acontece
  dias.forEach(dia => {
    data.turnos.forEach((_, idTurno) => {
      data.aulas.forEach((_, idAula) => {
        subjectTo.push({
          name: `ministra-se-aula:${idAula}:${dia}:${idTurno}`,
          vars: data.funcionarios
            .map((_, idFuncionario) => ({
              name: `${VarsNames.MINISTRA}:${idFuncionario}:${idAula}:${dia}:${idTurno}`,
              coef: 1
            }))
            .concat({
              name: `${VarsNames.AULA}:${idAula}:${dia}:${idTurno}`,
              coef: -1 * data.funcionarios.length
            }),
          bnds: { type: glpk.GLP_UP, lb: -1 * data.funcionarios.length, ub: 0 }
        })
      })
    })
  })

  // Aula acontece se funcionário ministra
  dias.forEach(dia => {
    data.turnos.forEach((_, idTurno) => {
      data.aulas.forEach((aula, idAula) => {
        const vars = data.funcionarios
          .filter(funcionario => funcionario.aulas.includes(aula.nome))
          .map((_, idFuncionario) => ({
            name: `${VarsNames.MINISTRA}:${idFuncionario}:${idAula}:${dia}:${idTurno}`,
            coef: 1
          }))
          .concat({
            name: `${VarsNames.AULA}:${idAula}:${dia}:${idTurno}`,
            coef: -1
          })
        if (aula.custoProfessor > 0)
          vars.push({
            name: pushReturn(`${VarsNames.PROFESSOR_CONTRATADO}:${idAula}:${dia}:${idTurno}`, binaryVars),
            coef: +!!aula.custoProfessor
          })

        subjectTo.push({
          name: `aula-se-ministra:${idAula}:${dia}:${idTurno}`,
          vars,
          bnds: { type: glpk.GLP_LO, lb: 0, ub: data.funcionarios.length + 1 }
        })
      })
    })
  })

  return { objective, subjectTo, binaryVars }
}
