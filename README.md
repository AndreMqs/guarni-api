<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

### Recuperação manual do OWNER

Se o proprietário esqueceu o username, consulte os cadastros primeiro:

```powershell
npm run admin:list-users
```

A listagem mostra ID, nome, username, unidades, papel e situação dos vínculos.
Inclui usuários sem vínculo e vínculos inativos. A coluna `Reset OWNER` indica
quem possui pelo menos um vínculo OWNER ativo e pode usar o comando abaixo.
Não consulta nem exibe senhas ou hashes. É uma consulta administrativa via
terminal, usando `DATABASE_URL` do ambiente ou do `.env`, sem rota pública.
Com o build pronto, use `node dist/admin/list-users.cli.js` no ambiente do banco.

Com o PostgreSQL acessível e `DATABASE_URL` configurada, execute em um terminal:

```powershell
npm run owner:reset-password -- username.do.owner
```

O comando compila o projeto, carrega o `.env` se existir e mostra o banco,
servidor e usuário selecionados. Confira esses dados e digite
`RESET username.do.owner` para confirmar. Qualquer outro texto cancela.
Ele exige um vínculo OWNER ativo, gera uma senha aleatória e salva apenas seu
hash Argon2id. A nova senha aparece no terminal depois do commit; guarde-a e
entregue-a ao proprietário após verificar sua identidade. Não grave essa saída
em logs nem use o comando no start/deploy automático da aplicação.

Esse comando é uma operação administrativa para quem tem acesso ao banco.
Não depende da senha antiga nem do token de setup, não cria usuários e não
reativa memberships. Como a senha pertence ao User, muda o login em todas as
unidades desse usuário. Se perder a nova senha, execute a recuperação novamente.

O reset incrementa `credentialVersion`: tokens anteriores são rejeitados pelo
guard nas próximas requisições. A senha gerada não expira e ainda não há troca
obrigatória no próximo login. Após fazer login, use `PUT /v1/auth/password` com
`currentPassword` e `newPassword`. A resposta contém um novo `accessToken`, que
substitui o token anterior (inclusive no Authorize do Swagger).

Em um ambiente com o build pronto e `DATABASE_URL` já definida, também é possível
executar `node dist/admin/reset-owner-password.cli.js username.do.owner` em um
terminal interativo com acesso ao banco. Não é necessário publicar uma API de
recuperação. Use Node 24, como no ambiente de desenvolvimento.

### Execução das suites

Os E2E usam o PostgreSQL local e o banco exclusivo `guarni_test`, configurado
em `test/setup-env.ts`. Esse banco precisa existir e ter todas as migrations
aplicadas, incluindo `PrepareMvpDomain1790000000000`. As suites limpam os dados
de usuários, unidades e memberships; não use esse banco para dados pessoais.
As suites executam em sequência porque compartilham o banco.

`src/setup/setup.service.spec.ts` cobre a validação do segredo sem banco.
`test/setup.e2e-spec.ts` cobre o contrato HTTP, persistência, rollback e
concorrência com PostgreSQL real. O teste de concorrência aguarda duas
requisições disputarem o advisory lock antes de liberá-lo.

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Continuação guiada de backend

Para continuar o MVP respeitando a trilha de aprendizado, leia:

- `GUARNI_API_MVP_IMPLEMENTATION_PLAN.md` — especificação funcional/técnica do backend.
- `LEARNING_NEXT_STEPS.md` — separa boilerplate já preparado dos conceitos novos que devem ser implementados manualmente.

Algumas rotas novas retornam `501 Not Implemented` de propósito até os respectivos checkpoints de aprendizado serem concluídos.
