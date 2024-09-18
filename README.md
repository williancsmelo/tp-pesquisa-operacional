# Trabalho Prático - Pesquisa Operacional

Projeto que busca solucionar a tomada de decisão em uma academia através de programação linear.

## Índice

- [Dependências](#dependências)
- [Instalação](#instalação)
- [Uso](#uso)
- [Licença](#licença)

## Dependências

O projeto utiliza as seguintes tecnologias e dependências principais:

- Node.js 14

## Instalação

### Pré-requisitos

Certifique-se de que você tem o **Node.js 14** instalado. Caso não tenha, você pode baixá-lo [aqui](https://nodejs.org/en/download/releases/).

Para verificar a versão instalada do Node.js, execute:

```bash
node -v
```

### Passos para instalar o projeto

1. Acesse o diretório do projeto

2. Instale as dependências:

```bash
  npm install
```

## Uso

1. Na pasta `input` crie o arquivo de entrada para o programa, o repositório acompanha o arquivo `input/example.json` para servir de exemplo, além disso esses dados devem seguir as regras estabelecidas em `src/input-validation.ts`.

2. Execute o programa:

```bash
  npm start -- -i <nome-do-arquivo-de-entrada> -o <nome-do-arquivo-de-saida>
```

ou gere o build e execute uma versão mais otimizada:

```bash
  npm run build
  node build -i <nome-do-arquivo-de-entrada> -o <nome-do-arquivo-de-saida>
```

O arquivo de entrada será buscado em `input/<nome-do-arquivo-de-entrada>` e o arquivo de saída será encontrado em `output/<nome-do-arquivo-de-saida>`  
Os argumentos `-i` e `-o` são opcionais e utilizará por padrão os nomes `input.json` e `output.json`

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).
