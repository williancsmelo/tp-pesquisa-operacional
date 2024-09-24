import * as yup from 'yup'
import { TEMPO_POR_TURNO } from './config'

export const inputValidation = yup.object().shape({
  dias: yup.number().integer().min(1).required(),
  turnos: yup
    .array()
    .min(1)
    .max(24 / TEMPO_POR_TURNO)
    .of(yup.number().integer().min(0).required())
    .required(),
  turnosSemAula: yup.array().of(yup.number().integer().min(1).required()).default([]),
  aulas: yup
    .array()
    .of(
      yup.object().shape({
        nome: yup.string().min(1).required(),
        alunosEsperados: yup.number().integer().min(0).required(),
        minimoSemanal: yup.number().integer().min(0).default(0),
        precoPorAluno: yup.number().min(0).required(),
        custoProfessor: yup.number().min(0).default(0)
      })
    )
    .default([])
    .test('aulas-unicas', 'Aulas devem ter nomes únicos', aulas => {
      const nomes = aulas.map(aula => aula.nome)
      return new Set(nomes).size === nomes.length
    }),
  funcionarios: yup
    .array()
    .min(0)
    .of(
      yup.object().shape({
        nome: yup.string(),
        salario: yup.number().min(0).required(),
        tempoMaximo: yup.number().min(0).required(),
        experiente: yup.boolean().default(false),
        aulas: yup.array().of(yup.string()).default([])
      })
    )
    .required()
})

export type Input = yup.InferType<typeof inputValidation>
