// Banco de questões originais no estilo FGV, baseadas no Anexo I do edital DATAPREV 2026 (Perfil 3).
// Formato: { id, disc, q, opts: [A..E], ans: 'A'..'E', exp }

export const DISCIPLINES = {
  dev: 'Desenvolvimento (Java, Spring, Front, Mobile)',
  arq: 'Arquitetura e Integração',
  proc: 'Processo: Testes, Ágil, DevOps, Requisitos',
  seg: 'Segurança da Informação',
  bd: 'Banco de Dados e BI',
  gov: 'Gestão e Governança de TI',
  outros: 'Outros temas de TI (redes, nuvem, infra, dados)',
  leg: 'Legislação (LGPD, LAI, Marco Civil)',
  ia: 'Atualidades e IA',
  rlm: 'Raciocínio Lógico',
  ling: 'Português e Inglês',
};

// Disciplinas que valem peso 2,5 (Conhecimentos Específicos)
// "outros": específicas dos demais cadernos de TI da prova de 2026, fora dos temas acima
export const SPECIFIC = new Set(['dev', 'arq', 'proc', 'seg', 'bd', 'gov', 'outros']);

let n = 0;
const q = (disc, text, opts, ans, exp) => ({ id: `${disc}-${++n}`, disc, q: text, opts, ans, exp });

export const QUESTIONS = [
  // ───────────────────────── DESENVOLVIMENTO ─────────────────────────
  q('dev', 'Sobre o ecossistema Spring, assinale a afirmativa correta.', [
    'O Spring Boot exige a implantação da aplicação em um servidor de aplicação externo, como JBoss ou WebLogic.',
    'O Spring Cloud fornece padrões para sistemas distribuídos, como configuração centralizada, descoberta de serviços e circuit breaker.',
    'O Spring Framework é voltado exclusivamente a aplicações monolíticas.',
    'O Hibernate é o framework de injeção de dependências do Spring.',
    'O Spring Boot elimina a necessidade de qualquer dependência Maven ou Gradle.',
  ], 'B', 'Spring Cloud = padrões distribuídos (Config Server, Eureka/discovery, Gateway, Resilience4j/circuit breaker, OpenFeign). Spring Boot traz servidor EMBUTIDO (Tomcat por padrão) e auto-configuração via starters; Hibernate é ORM (implementação de JPA).'),

  q('dev', 'Na JPA, o tipo de carregamento (fetch) PADRÃO dos relacionamentos @OneToMany e @ManyToOne é, respectivamente:', [
    'EAGER e EAGER.', 'LAZY e LAZY.', 'LAZY e EAGER.', 'EAGER e LAZY.', 'Definido obrigatoriamente pelo desenvolvedor, sem padrão.',
  ], 'C', 'Regra: relacionamentos "para muitos" (@OneToMany, @ManyToMany) são LAZY; relacionamentos "para um" (@ManyToOne, @OneToOne) são EAGER. Cuidado com o problema N+1.'),

  q('dev', 'Uma entidade JPA foi carregada pelo EntityManager, e em seguida o contexto de persistência foi fechado. Nesse momento, a entidade está no estado:', [
    'new (transient).', 'managed.', 'removed.', 'detached.', 'persisted.',
  ], 'D', 'Estados JPA: new/transient (nunca associada), managed (no contexto de persistência), detached (o contexto fechou ou houve clear/detach) e removed (marcada para remoção). Uma entidade detached volta a ser managed com merge().'),

  q('dev', 'O ciclo de vida de uma requisição JSF é composto por seis fases. Assinale a opção que apresenta a PRIMEIRA e a ÚLTIMA fase, respectivamente.', [
    'Apply Request Values e Invoke Application.',
    'Restore View e Render Response.',
    'Process Validations e Update Model Values.',
    'Restore View e Invoke Application.',
    'Render Response e Restore View.',
  ], 'B', 'Ordem: Restore View → Apply Request Values → Process Validations → Update Model Values → Invoke Application → Render Response. O PrimeFaces é uma biblioteca de componentes para JSF.'),

  q('dev', 'Em relação ao JUnit 5, assinale a opção correta.', [
    '@BeforeAll executa antes de cada método de teste.',
    '@BeforeEach deve obrigatoriamente anotar um método estático.',
    'assertThrows permite verificar se um trecho de código lança determinada exceção.',
    '@Test só pode ser usado em métodos que retornam boolean.',
    'O JUnit é um framework de mapeamento objeto-relacional.',
  ], 'C', '@BeforeEach roda antes de CADA teste; @BeforeAll roda uma vez antes de todos e, por padrão, exige método static. assertThrows(Excecao.class, () -> ...) verifica exceções. Mocks costumam vir do Mockito.'),

  q('dev', 'Sobre Java, assinale a afirmativa INCORRETA.', [
    'Objetos String são imutáveis.',
    'Se dois objetos são iguais segundo equals(), devem ter o mesmo hashCode().',
    'Desde o Java 8, interfaces podem ter métodos default.',
    'Exceções do tipo RuntimeException são verificadas (checked) e precisam ser declaradas com throws.',
    'Records (Java 16+) são classes concisas e imutáveis voltadas a transportar dados.',
  ], 'D', 'RuntimeException e suas subclasses são UNCHECKED: não precisam de try/catch nem de throws. As checked exceptions são subclasses de Exception que não estendem RuntimeException (ex.: IOException).'),

  q('dev', 'Na anotação @Transactional do Spring, a propagação padrão (REQUIRED) significa que o método:', [
    'sempre cria uma nova transação, suspendendo a atual.',
    'participa da transação existente ou cria uma nova, se não houver.',
    'executa sem transação e lança exceção se existir uma.',
    'exige uma transação existente e lança exceção se não houver.',
    'executa em uma transação aninhada com savepoint.',
  ], 'B', 'REQUIRED (padrão) reaproveita a transação existente ou cria uma nova. REQUIRES_NEW sempre cria uma nova; MANDATORY exige uma existente; NEVER proíbe; NESTED usa savepoint. Por padrão, o rollback ocorre em RuntimeException.'),

  q('dev', 'A anotação @RestController do Spring equivale à combinação de:', [
    '@Component e @Service.', '@Controller e @ResponseBody.', '@Controller e @RequestMapping.', '@Service e @Repository.', '@Configuration e @Bean.',
  ], 'B', '@RestController = @Controller + @ResponseBody: o retorno dos métodos é serializado diretamente (JSON) no corpo da resposta, sem resolver uma view.'),

  q('dev', 'Uma equipe precisa desenvolver um único código-base para Android e iOS, compilado para código nativo e usando a linguagem Dart. O framework adequado é:', [
    'React Native.', 'Ionic.', 'Flutter.', 'SwiftUI.', 'Kotlin Multiplatform com Jetpack Compose exclusivamente.',
  ], 'C', 'Flutter (Google) usa Dart e tem engine de renderização própria. React Native usa JavaScript com componentes nativos; Ionic/Cordova é híbrido (WebView); Xamarin/.NET MAUI usa C#. SwiftUI é apenas para plataformas Apple.'),

  q('dev', 'Sobre SPA e PWA, assinale a opção correta.', [
    'Toda SPA é, necessariamente, uma PWA.',
    'PWA depende de Service Workers e de um Web App Manifest para recursos como funcionamento offline e instalação.',
    'SPAs recarregam a página inteira a cada navegação.',
    'PWAs só funcionam com o framework Angular.',
    'PWAs dispensam HTTPS.',
  ], 'B', 'SPA = uma única página com atualização dinâmica (sem reload completo). PWA = Service Worker (cache/offline/push) + Manifest (instalação) + HTTPS obrigatório. Uma SPA pode ou não ser PWA.'),

  q('dev', 'Em relação aos frameworks de front-end, assinale a afirmativa correta.', [
    'O React adota fluxo de dados unidirecional e usa um DOM virtual para otimizar atualizações.',
    'O Angular é uma biblioteca JavaScript sem suporte a TypeScript.',
    'O Vue.js não oferece mecanismo de reatividade.',
    'O React impõe o padrão MVC completo, com injeção de dependências nativa.',
    'Ajax exige o recarregamento completo da página para obter dados do servidor.',
  ], 'A', 'React: biblioteca de UI, virtual DOM, fluxo unidirecional e hooks. Angular: framework completo em TypeScript, com DI e two-way binding. Vue: reatividade e v-model. Ajax faz requisições assíncronas (XMLHttpRequest/fetch) SEM recarregar a página.'),

  q('dev', 'Segundo os princípios de Clean Code e as métricas do SonarQube, assinale a opção correta.', [
    'Code smell é um erro que impede a compilação.',
    'O Quality Gate é um conjunto de condições que o projeto deve atender para ser considerado apto (ex.: cobertura mínima em código novo).',
    'O SonarQube executa a aplicação para encontrar falhas, sendo uma ferramenta de análise dinâmica.',
    'Funções longas, com múltiplas responsabilidades, são recomendadas para reduzir chamadas.',
    'Dívida técnica não pode ser medida.',
  ], 'B', 'SonarQube faz análise ESTÁTICA (não executa o código) e classifica Bugs, Vulnerabilities, Security Hotspots e Code Smells. Mede dívida técnica (tempo estimado para corrigir), duplicação e cobertura. Quality Gate = critérios de aprovação.'),

  q('dev', 'Sobre ferramentas low-code e no-code, assinale a opção correta.', [
    'Eliminam completamente a necessidade de governança de TI.',
    'Permitem construir aplicações por meio de interfaces visuais, com riscos como dependência do fornecedor (lock-in) e shadow IT.',
    'São adequadas apenas para sistemas de altíssima complexidade e desempenho crítico.',
    'No-code exige conhecimento avançado de programação.',
    'Não permitem integração com APIs.',
  ], 'B', 'Low-code: desenvolvimento visual com pontos de extensão por código. No-code: voltado a "citizen developers". Os riscos clássicos são vendor lock-in, shadow IT, limitações de escalabilidade e a necessidade de governança.'),

  q('dev', 'O padrão de projeto GoF que define uma família de algoritmos, encapsula cada um e os torna intercambiáveis em tempo de execução é o:', [
    'Observer.', 'Decorator.', 'Strategy.', 'Template Method.', 'Singleton.',
  ], 'C', 'Strategy troca o algoritmo por composição. Template Method define o esqueleto por herança. Observer = notificação 1:N; Decorator = adiciona responsabilidades dinamicamente; Singleton = instância única.'),

  q('dev', 'Os padrões GoF Adapter, Facade, Proxy e Composite pertencem à categoria:', [
    'Criacionais.', 'Comportamentais.', 'Estruturais.', 'Arquiteturais.', 'Concorrentes.',
  ], 'C', 'Criacionais: Singleton, Factory Method, Abstract Factory, Builder, Prototype. Estruturais: Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy. Comportamentais: Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor, Interpreter.'),

  q('dev', 'A classe Retangulo possui setLargura e setAltura independentes. A subclasse Quadrado sobrescreve ambos para manter os lados iguais, e um cliente que usava Retangulo passa a obter áreas inesperadas. O princípio SOLID violado é o:', [
    'Single Responsibility.', 'Open/Closed.', 'Liskov Substitution.', 'Interface Segregation.', 'Dependency Inversion.',
  ], 'C', 'LSP: subtipos devem poder substituir o tipo base sem quebrar o comportamento esperado (o contrato). Atenção: sobrescrever um método NÃO viola o LSP por si só; a violação ocorre quando o contrato ou as expectativas do cliente são quebrados.'),

  q('dev', 'O princípio SOLID segundo o qual módulos de alto nível não devem depender de módulos de baixo nível, mas ambos de abstrações, é o:', [
    'Single Responsibility.', 'Open/Closed.', 'Liskov Substitution.', 'Interface Segregation.', 'Dependency Inversion.',
  ], 'E', 'DIP é a base da injeção de dependências. OCP = aberto para extensão, fechado para modificação. ISP = interfaces específicas em vez de uma "gorda". SRP = um único motivo para mudar.'),

  // ───────────────────────── ARQUITETURA E INTEGRAÇÃO ─────────────────────────
  q('arq', 'Considerando os métodos HTTP em APIs REST, assinale a opção que apresenta apenas métodos idempotentes.', [
    'GET, POST e PUT.', 'POST, PATCH e DELETE.', 'GET, PUT e DELETE.', 'POST e PUT.', 'PATCH e POST.',
  ], 'C', 'Idempotentes: GET, HEAD, OPTIONS, PUT, DELETE. Seguros (não alteram estado): GET, HEAD, OPTIONS. POST não é idempotente; PATCH não é garantidamente idempotente.'),

  q('arq', 'Um cliente envia uma requisição sem token de autenticação válido para um recurso protegido. O código HTTP mais adequado é:', [
    '400 Bad Request.', '401 Unauthorized.', '403 Forbidden.', '404 Not Found.', '409 Conflict.',
  ], 'B', '401 = não autenticado (credenciais ausentes ou inválidas). 403 = autenticado, porém sem permissão. 201 = Created; 204 = No Content; 409 = conflito de estado; 422 = entidade não processável.'),

  q('arq', 'Sobre XML, XSLT, UDDI e WSDL, assinale a opção correta.', [
    'XSLT é uma linguagem para transformar documentos XML em outros formatos, como HTML ou outro XML.',
    'UDDI é o protocolo de transporte de mensagens SOAP.',
    'WSDL é um formato binário de serialização de dados.',
    'Todo documento XML bem-formado é necessariamente válido.',
    'JSON tem suporte nativo a transformações XSLT.',
  ], 'A', 'XSLT transforma XML (usando XPath). WSDL descreve a interface do web service; UDDI é o registro/diretório de serviços; SOAP é o protocolo de mensagens. Bem-formado = sintaxe correta; válido = obedece a um DTD/XSD. Todo válido é bem-formado, mas não o contrário.'),

  q('arq', 'Assinale a característica que NÃO é uma restrição do estilo arquitetural REST.', [
    'Comunicação stateless.', 'Interface uniforme.', 'Cacheabilidade.', 'Sistema em camadas.', 'Contrato formal obrigatório descrito em WSDL.',
  ], 'E', 'Restrições REST (Fielding): cliente-servidor, stateless, cache, interface uniforme (inclusive HATEOAS), sistema em camadas e code-on-demand (opcional). WSDL é típico de SOAP. Swagger/OpenAPI documenta APIs REST, mas não é exigido pelo estilo.'),

  q('arq', 'Em uma arquitetura de microsserviços, o componente que serve como ponto único de entrada para os clientes, realizando roteamento, autenticação e rate limiting, é o:', [
    'Service Registry.', 'API Gateway.', 'Circuit Breaker.', 'Message Broker.', 'Sidecar de banco de dados.',
  ], 'B', 'API Gateway = porta de entrada única (roteamento, autenticação, agregação, rate limit). Service Registry/Discovery = localização dos serviços (ex.: Eureka). Circuit Breaker = evita falhas em cascata. Message Broker = mensageria assíncrona.'),

  q('arq', 'Em uma transação de negócio que envolve vários microsserviços, cada um com seu próprio banco, a equipe adotou uma sequência de transações locais com ações compensatórias em caso de falha. Esse padrão é o:', [
    'Two-Phase Commit (2PC).', 'Saga.', 'CQRS.', 'Strangler Fig.', 'Bulkhead.',
  ], 'B', 'Saga: transações locais + compensações, com consistência eventual, por coreografia (eventos) ou orquestração (coordenador central). 2PC: coordenador com fases de preparação e commit; garante atomicidade, mas é bloqueante e acopla os serviços.'),

  q('arq', 'Sobre a arquitetura hexagonal, assinale a opção correta.', [
    'Também chamada de Portas e Adaptadores, isola o núcleo de domínio das tecnologias externas (UI, banco, mensageria).',
    'Obriga a lógica de negócio a depender diretamente do framework de persistência.',
    'É sinônimo de arquitetura em camadas com 6 camadas fixas.',
    'Não pode ser usada em microsserviços.',
    'Os adaptadores ficam dentro do domínio.',
  ], 'A', 'Alistair Cockburn: o domínio define PORTAS (interfaces) e os ADAPTADORES (REST, JPA, Kafka...) as implementam do lado de fora. Isso facilita testes e a troca de tecnologias, e combina bem com microsserviços.'),

  q('arq', 'Em mensageria, a diferença entre fila (queue) e tópico (topic) é que:', [
    'na fila, cada mensagem é consumida por um único consumidor; no tópico, a mensagem é entregue a todos os assinantes.',
    'a fila é síncrona e o tópico é assíncrono.',
    'tópicos não persistem mensagens em nenhuma hipótese.',
    'filas só funcionam com REST.',
    'não há diferença; são sinônimos.',
  ], 'A', 'Fila = ponto a ponto (competing consumers). Tópico = publish/subscribe. Mensageria desacopla produtor e consumidor no tempo. Com garantia "at-least-once", os consumidores devem ser idempotentes. Exemplos: RabbitMQ, Kafka, ActiveMQ/JMS.'),

  q('arq', 'Sobre servidor web e servidor de aplicação no ecossistema Java, assinale a opção correta.', [
    'O Apache Tomcat é um servidor de aplicação Jakarta EE completo, com suporte nativo a EJB.',
    'O servidor web atende requisições HTTP e conteúdo estático; o servidor de aplicação provê um ambiente de execução para a lógica de negócio (transações, EJB, JMS etc.).',
    'O servidor de aplicação não processa requisições HTTP.',
    'WildFly e GlassFish são apenas servidores de arquivos estáticos.',
    'Servidores web não podem atuar como proxy reverso.',
  ], 'B', 'Tomcat é um container de Servlets/JSP (web container), não um Jakarta EE completo. WildFly (JBoss), GlassFish, WebLogic e WebSphere são servidores de aplicação completos. Nginx e Apache HTTPD servem conteúdo estático e atuam como proxy reverso.'),

  q('arq', 'Em relação a containers e máquinas virtuais, assinale a opção correta.', [
    'Containers incluem um sistema operacional completo com kernel próprio.',
    'Containers compartilham o kernel do host, sendo mais leves e de inicialização mais rápida que VMs.',
    'Uma imagem Docker é mutável em tempo de execução.',
    'No Kubernetes, a menor unidade implantável é o Deployment.',
    'Containers não podem ser orquestrados.',
  ], 'B', 'VM = hypervisor + SO convidado completo. Container = isolamento por namespaces/cgroups com kernel compartilhado. A imagem é imutável e feita de camadas; o container é a instância em execução. No Kubernetes, a menor unidade é o Pod.'),

  q('arq', 'Sobre Internet, intranet, extranet e portais corporativos, assinale a opção correta.', [
    'A intranet é uma rede pública acessível por qualquer pessoa.',
    'A extranet estende parte da intranet a parceiros externos autorizados (fornecedores, clientes), com acesso controlado.',
    'Uma intranet não pode usar protocolos TCP/IP.',
    'O portal corporativo é necessariamente público.',
    'Extranet e Internet são sinônimos.',
  ], 'B', 'Intranet = rede privada que usa tecnologias da Internet, para uso interno. Extranet = acesso controlado de parceiros externos. Portal = ponto único de acesso a informações e serviços (pode ser interno ou externo).'),

  q('arq', 'Sobre blockchain pública (como Bitcoin), assinale o elemento que NÃO é armazenado no cabeçalho do bloco.', [
    'Hash do bloco anterior.', 'Raiz de Merkle das transações.', 'Timestamp.', 'Nonce.', 'Saldo consolidado de cada carteira.',
  ], 'E', 'O cabeçalho do bloco contém o hash anterior (encadeamento e imutabilidade), a Merkle root, o timestamp, o nonce (PoW) e a dificuldade. O saldo NÃO é armazenado: é derivado do histórico de transações (UTXO no Bitcoin).'),

  q('arq', 'Sobre o protocolo TLS, assinale a opção correta.', [
    'O TLS foi substituído pelo SSL 3.0 por ser menos seguro.',
    'O TLS é o sucessor do SSL; as versões do SSL estão obsoletas por vulnerabilidades conhecidas.',
    'O HTTPS só funciona com SSL 2.0.',
    'O TLS usa apenas criptografia assimétrica durante toda a sessão.',
    'O TLS 1.3 aumentou o número de cifras suportadas, incluindo RC4.',
  ], 'B', 'SSL (2.0 e 3.0) está obsoleto (POODLE etc.). O TLS usa assimétrica no handshake (troca de chaves e autenticação por certificado) e simétrica nos dados. O TLS 1.3 removeu cifras fracas, tornou o forward secrecy obrigatório e reduziu o handshake a 1-RTT.'),

  q('arq', 'Uma empresa precisa integrar sistemas legados heterogêneos, expondo funcionalidades como serviços reutilizáveis, com contratos bem definidos e baixo acoplamento. A abordagem mais adequada é:', [
    'Arquitetura monolítica com acesso direto às bases de cada sistema.',
    'Arquitetura Orientada a Serviços (SOA), possivelmente com um barramento de serviços (ESB).',
    'Compartilhamento de arquivos por e-mail.',
    'Replicação total dos bancos legados em uma única base.',
    'Triggers de banco chamando os sistemas por RPC proprietário.',
  ], 'B', 'SOA: serviços com contratos, reuso, baixo acoplamento e interoperabilidade (SOAP/WSDL ou REST). O ESB faz roteamento, transformação e orquestração. Microsserviços são uma evolução, com serviços menores e "smart endpoints, dumb pipes".'),

  // ───────────────────────── PROCESSO: TESTES, ÁGIL, DEVOPS, REQUISITOS ─────────────────────────
  q('proc', 'Segundo o Guia do Scrum (2020), assinale a opção correta.', [
    'O Scrum define três papéis hierárquicos, sendo o Scrum Master o chefe dos Developers.',
    'Os compromissos (commitments) são: Meta do Produto, Meta da Sprint e Definição de Pronto.',
    'A Daily Scrum tem duração máxima de 30 minutos.',
    'A Sprint pode ter até 2 meses.',
    'Somente o Product Owner pode participar da Sprint Retrospective.',
  ], 'B', 'Guia 2020: responsabilidades (accountabilities) de Product Owner, Scrum Master e Developers, sem hierarquia, em um Scrum Team auto-gerenciável. Artefatos e compromissos: Product Backlog→Meta do Produto; Sprint Backlog→Meta da Sprint; Incremento→Definição de Pronto. Sprint de até 1 mês; Daily de 15 min.'),

  q('proc', 'Durante a Daily Scrum, um Developer relata um impedimento técnico. A postura esperada do Scrum Master é:', [
    'reatribuir a tarefa a outro Developer sem consultar o time.',
    'assumir pessoalmente a implementação da tarefa.',
    'garantir que o impedimento seja removido, promovendo a auto-gestão do time.',
    'cancelar a Sprint imediatamente.',
    'transferir o problema ao Product Owner para replanejar o backlog.',
  ], 'C', 'O Scrum Master é um líder que serve: remove impedimentos e facilita, sem microgerenciar. Só o Product Owner pode cancelar a Sprint, e apenas se a Meta da Sprint se tornar obsoleta.'),

  q('proc', 'O método Kanban tem como práticas centrais:', [
    'sprints de duração fixa e papel obrigatório de Scrum Master.',
    'visualizar o fluxo de trabalho, limitar o trabalho em progresso (WIP) e gerenciar o fluxo.',
    'programação em pares obrigatória e cliente presente.',
    'planejamento detalhado de todas as fases antes do início.',
    'estimativa obrigatória em pontos de função.',
  ], 'B', 'Kanban = fluxo contínuo e sistema puxado (pull), com limites de WIP e métricas como lead time (do pedido à entrega) e cycle time (do início do trabalho à entrega). Não prescreve iterações nem papéis.'),

  q('proc', 'São práticas típicas do XP (Extreme Programming):', [
    'Programação em pares, TDD, integração contínua, refatoração e pequenas entregas.',
    'Daily de 15 minutos, Sprint Review e Product Owner.',
    'Limites de WIP e cadência de reabastecimento.',
    'Fases sequenciais com documentação exaustiva.',
    'Uso obrigatório de UML completa antes da codificação.',
  ], 'A', 'XP: pair programming, TDD, CI, refactoring, small releases, design simples, propriedade coletiva, ritmo sustentável, cliente presente, padrões de código e jogo do planejamento. Valores: comunicação, simplicidade, feedback, coragem e respeito.'),

  q('proc', 'O ciclo do TDD (Test-Driven Development) é corretamente descrito por:', [
    'Codificar → Testar → Documentar.', 'Red → Green → Refactor.', 'Planejar → Executar → Verificar → Agir.', 'Given → When → Then.', 'Build → Measure → Learn.',
  ], 'B', 'TDD: escreve um teste que falha (Red), implementa o mínimo para passar (Green) e refatora (Refactor). Given/When/Then é a sintaxe do BDD (Gherkin/Cucumber); PDCA é o ciclo de melhoria; Build-Measure-Learn vem do Lean Startup.'),

  q('proc', 'Sobre a pirâmide de testes, assinale a opção correta.', [
    'Deve haver mais testes de ponta a ponta (E2E) do que testes unitários.',
    'Testes unitários, na base, são mais numerosos, rápidos e baratos; testes E2E, no topo, são poucos, lentos e frágeis.',
    'Testes de integração são dispensáveis quando há testes E2E.',
    'Testes unitários dependem obrigatoriamente do banco de dados real.',
    'A pirâmide recomenda apenas testes manuais.',
  ], 'B', 'Base: unitários (isolados, com mocks). Meio: integração (interação entre módulos/componentes). Topo: E2E/UI. Também são cobrados: regressão, smoke, aceitação, caixa-branca vs caixa-preta e testes de usabilidade (com usuários reais).'),

  q('proc', 'Na prática de DevOps, a capacidade de manter o software sempre pronto para ir para produção, com a liberação dependendo de uma decisão manual, corresponde a:', [
    'Integração Contínua.', 'Entrega Contínua (Continuous Delivery).', 'Implantação Contínua (Continuous Deployment).', 'Gerência de Configuração.', 'Monitoramento Contínuo.',
  ], 'B', 'CI = integrar e testar automaticamente a cada commit. Continuous DELIVERY = sempre implantável, com aprovação manual para produção. Continuous DEPLOYMENT = vai para produção automaticamente se o pipeline passar. Na FGV 2024, "fornecer rapidamente nova versão em produção" foi considerado Entrega Contínua.'),

  q('proc', 'No Git, um commit com erro já foi enviado ao repositório remoto compartilhado. A forma mais segura de desfazê-lo, preservando o histórico, é:', [
    'git reset --hard HEAD~1 seguido de git push --force.', 'git revert <commit>.', 'git stash.', 'git rebase -i para apagar o commit.', 'git checkout -b novo-branch.',
  ], 'B', 'git revert cria um NOVO commit que desfaz o anterior, sem reescrever o histórico (seguro em branches compartilhados). reset e rebase reescrevem o histórico. cherry-pick aplica um commit específico em outro branch; stash guarda alterações temporariamente.'),

  q('proc', 'Em relação a git merge e git rebase, assinale a opção correta.', [
    'O rebase preserva os commits originais com os mesmos hashes.',
    'O merge reescreve o histórico do branch de destino.',
    'O rebase reaplica os commits sobre outra base, gerando histórico linear com novos hashes.',
    'O merge nunca gera commit de merge.',
    'Ambos são equivalentes a git fetch.',
  ], 'C', 'O merge preserva o histórico e pode criar um merge commit (exceto em fast-forward). O rebase reescreve os commits (novos hashes) e produz um histórico linear; evite usá-lo em branches públicos. git pull = fetch + merge (ou rebase, com --rebase).'),

  q('proc', '"O sistema deve exibir o saldo atualizado em até 2 segundos após a transação." Esse requisito é classificado como:', [
    'Funcional.', 'Não funcional (desempenho).', 'Regra de negócio de domínio.', 'Requisito de usuário de interface.', 'Restrição legal.',
  ], 'B', 'Requisito funcional = O QUE o sistema faz. Não funcional = COMO/qualidade (desempenho, segurança, usabilidade, disponibilidade). O tempo de resposta é desempenho. Atenção: a FGV mistura os dois no mesmo enunciado.'),

  q('proc', 'Sobre técnicas de elicitação de requisitos, assinale a opção correta.', [
    'A etnografia consiste em observar os usuários no seu ambiente real de trabalho.',
    'O brainstorming é inadequado à elicitação de requisitos.',
    'A prototipação é uma técnica de entrevista estruturada.',
    'A elicitação ocorre somente após a implementação.',
    'Questionários eliminam a necessidade de validação.',
  ], 'A', 'Técnicas: entrevistas (abertas ou fechadas), questionários, brainstorming, JAD (workshop), observação/etnografia, prototipação, cenários e casos de uso, análise de documentos. O processo de ER envolve elicitação, análise, especificação, validação e gerenciamento.'),

  q('proc', 'Comparando Ponto de Função (PF) e Story Points (SP), assinale a opção correta.', [
    'O SP é uma medida padronizada e comparável entre equipes diferentes.',
    'O PF mede o tamanho funcional sob a ótica do usuário, de forma independente da tecnologia e da equipe.',
    'O PF baseia-se no esforço percebido pela equipe.',
    'O SP é o mais indicado para contratos de escopo fechado.',
    'O PF não pode ser usado em contratos públicos.',
  ], 'B', 'PF (IFPUG/NESMA): padronizado, objetivo, usado em contratos públicos. Funções de dados: ALI e AIE; funções de transação: EE, SE e CE. SP: relativo ao time (complexidade, esforço e incerteza), não comparável entre times; usado com Planning Poker e velocidade.'),

  q('proc', 'Na contagem de Pontos de Função, um arquivo mantido DENTRO da fronteira da aplicação, por meio de seus processos elementares, é classificado como:', [
    'Arquivo de Interface Externa (AIE).', 'Arquivo Lógico Interno (ALI).', 'Entrada Externa (EE).', 'Saída Externa (SE).', 'Consulta Externa (CE).',
  ], 'B', 'ALI = mantido pela aplicação. AIE = apenas referenciado, mantido por outra aplicação. EE = processo que mantém um ALI ou altera comportamento. SE = saída com cálculo ou dado derivado. CE = consulta simples, sem cálculo.'),

  q('proc', 'RPA (Robotic Process Automation) é mais adequada para:', [
    'tarefas repetitivas, baseadas em regras, executadas sobre interfaces de sistemas existentes.',
    'decisões estratégicas não estruturadas que dependem de julgamento.',
    'substituir completamente a arquitetura de sistemas legados.',
    'treinar modelos de linguagem de grande porte.',
    'desenvolver aplicativos móveis nativos.',
  ], 'A', 'RPA: "robôs" de software imitam ações humanas na interface (cliques, digitação), em tarefas repetitivas, estáveis e baseadas em regras. Pode ser atended (com humano) ou unattended. Não substitui integração via APIs quando ela é possível.'),

  q('proc', 'No BDD (Behavior-Driven Development), cenários costumam ser escritos em linguagem:', [
    'UML, com diagramas de sequência.', 'Gherkin, com a estrutura Dado/Quando/Então (Given/When/Then).', 'BPMN, com raias.', 'SQL, com cláusulas SELECT.', 'Assembly.',
  ], 'B', 'O BDD estende o TDD com foco no comportamento, em linguagem ubíqua compartilhada com o negócio. Ferramentas: Cucumber, JBehave, SpecFlow.'),

  q('proc', 'Uma abordagem híbrida de gerenciamento de projetos caracteriza-se por:', [
    'usar exclusivamente práticas ágeis.',
    'combinar práticas ágeis e preditivas (tradicionais) conforme as necessidades do projeto.',
    'proibir o planejamento antecipado.',
    'adotar apenas as cerimônias do Scrum.',
    'eliminar a figura do gerente de projetos em qualquer contexto.',
  ], 'B', 'Preditivo = escopo definido no início (cascata). Ágil = iterativo e incremental. Híbrido = mistura, por exemplo, um planejamento macro preditivo com execução em sprints. Lean = eliminar desperdícios e entregar valor.'),

  // ───────────────────────── SEGURANÇA ─────────────────────────
  q('seg', 'Segundo a OWASP Top 10:2021, a categoria que ocupa a PRIMEIRA posição é:', [
    'Injection.', 'Broken Access Control.', 'Cryptographic Failures.', 'Server-Side Request Forgery.', 'Security Misconfiguration.',
  ], 'B', '2021: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection (inclui XSS), A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures, A09 Security Logging and Monitoring Failures, A10 SSRF. Na versão 2025, Broken Access Control continua em 1º e surge Software Supply Chain Failures.'),

  q('seg', 'Na OWASP Top 10:2021, o Cross-Site Scripting (XSS) passou a integrar a categoria:', [
    'Broken Access Control.', 'Injection.', 'Insecure Design.', 'Security Misconfiguration.', 'Identification and Authentication Failures.',
  ], 'B', 'Em 2021, o XSS foi incorporado à categoria A03 Injection. A defesa contra injeção inclui consultas parametrizadas (prepared statements), validação de entrada e codificação de saída (output encoding).'),

  q('seg', 'No OAuth 2.0, a entidade que emite tokens de acesso após autenticar o proprietário do recurso e obter sua autorização é o:', [
    'Resource Server.', 'Client.', 'Authorization Server.', 'Resource Owner.', 'User Agent.',
  ], 'C', 'Papéis do OAuth2: Resource Owner (usuário), Client (aplicação), Authorization Server (emite tokens) e Resource Server (API protegida). OAuth2 trata de AUTORIZAÇÃO; o OpenID Connect adiciona AUTENTICAÇÃO (ID Token JWT) e é a base de SSO moderno.'),

  q('seg', 'Para aplicações públicas (SPA, mobile) que usam OAuth 2.0, o fluxo atualmente recomendado é:', [
    'Implicit.', 'Resource Owner Password Credentials.', 'Authorization Code com PKCE.', 'Client Credentials.', 'Basic Authentication.',
  ], 'C', 'Authorization Code + PKCE para clientes públicos; Client Credentials para comunicação máquina-a-máquina (sem usuário). Os fluxos Implicit e Password são desaconselhados (OAuth 2.1 / Security BCP).'),

  q('seg', 'A política de controle de acesso em que o sistema compara rótulos de segurança (classificação) dos objetos com a habilitação dos sujeitos, sem que o proprietário possa alterar as permissões, é o controle:', [
    'Discricionário (DAC).', 'Mandatório (MAC).', 'Baseado em papéis (RBAC).', 'Baseado em atributos (ABAC).', 'Por lista de controle de acesso definida pelo dono.',
  ], 'B', 'MAC: rótulos e níveis definidos centralmente (ex.: militar). DAC: o dono do recurso decide (ACLs). RBAC: permissões associadas a papéis. ABAC: políticas sobre atributos do sujeito, do recurso e do ambiente.'),

  q('seg', 'A norma ABNT NBR ISO/IEC 27002:2022 organiza seus controles em:', [
    '14 seções e 114 controles.', '4 temas (organizacionais, de pessoas, físicos e tecnológicos) e 93 controles.', '5 domínios e 40 objetivos.', '10 áreas de conhecimento.', '7 princípios e 34 práticas.',
  ], 'B', '2022: 93 controles em 4 temas (37 organizacionais, 8 de pessoas, 14 físicos, 34 tecnológicos), com 11 controles novos (ex.: inteligência de ameaças, codificação segura, mascaramento de dados, prevenção de vazamento). 114 controles/14 seções era a versão de 2013. A 27001 é a norma CERTIFICÁVEL (requisitos do SGSI).'),

  q('seg', 'Sobre SAST e DAST, assinale a opção correta.', [
    'O SAST testa a aplicação em execução, simulando ataques externos.',
    'O DAST analisa o código-fonte sem executá-lo.',
    'O SAST analisa o código-fonte (caixa-branca) sem executar a aplicação e pode ser aplicado cedo no ciclo; o DAST testa a aplicação em execução (caixa-preta).',
    'Ambos só podem ser aplicados após a implantação em produção.',
    'O DAST identifica a linha exata do código vulnerável com maior precisão que o SAST.',
  ], 'C', 'SAST = estático, white-box, cedo (shift-left), aponta a linha do código, mas gera falsos positivos. DAST = dinâmico, black-box, app rodando, encontra problemas de runtime e configuração. IAST combina os dois; SCA analisa dependências de terceiros.'),

  q('seg', 'No SDL (Security Development Lifecycle) da Microsoft, a modelagem de ameaças (threat modeling) é uma atividade típica da fase de:', [
    'Treinamento.', 'Requisitos.', 'Design (projeto).', 'Release.', 'Resposta.',
  ], 'C', 'Fases do SDL: Treinamento, Requisitos, Design (modelagem de ameaças, ex.: STRIDE), Implementação (ferramentas aprovadas, SAST), Verificação (DAST, fuzzing), Release e Resposta a incidentes.'),

  q('seg', 'Pela recomendação X.800 (ITU-T), assinale a opção que apresenta um mecanismo de segurança ESPECÍFICO.', [
    'Trilha de auditoria de segurança.', 'Rótulo de segurança.', 'Preenchimento de tráfego.', 'Detecção de evento.', 'Funcionalidade confiável.',
  ], 'C', 'Específicos: cifragem, assinatura digital, controle de acesso, integridade de dados, troca de autenticação, preenchimento de tráfego, controle de roteamento e notarização. Pervasivos: funcionalidade confiável, rótulo de segurança, detecção de evento, trilha de auditoria e recuperação de segurança. (Caiu na FGV 2024.)'),

  q('seg', 'O princípio da segurança da informação que garante que a informação não foi alterada de forma não autorizada é a:', [
    'Confidencialidade.', 'Integridade.', 'Disponibilidade.', 'Autenticidade.', 'Irretratabilidade.',
  ], 'B', 'Tríade CID: Confidencialidade (acesso apenas a autorizados), Integridade (sem alteração indevida; hash), Disponibilidade (acessível quando necessário). Complementos: autenticidade (origem) e não repúdio (assinatura digital).'),

  q('seg', 'Na gestão de riscos, uma fraqueza de um ativo que pode ser explorada por uma ameaça é denominada:', [
    'Impacto.', 'Vulnerabilidade.', 'Incidente.', 'Controle.', 'Risco residual.',
  ], 'B', 'Ameaça = causa potencial de um incidente (agente). Vulnerabilidade = fraqueza explorável. Risco = probabilidade × impacto. Tratamentos: mitigar, transferir, evitar ou aceitar. Risco residual = o que resta após os controles.'),

  q('seg', 'O Single Sign-On (SSO) caracteriza-se por:', [
    'exigir uma senha diferente para cada sistema.',
    'permitir que o usuário se autentique uma única vez e acesse vários sistemas confiáveis sem nova autenticação.',
    'eliminar a necessidade de um provedor de identidade.',
    'ser incompatível com OpenID Connect e SAML.',
    'tratar apenas da criptografia do disco.',
  ], 'B', 'SSO: um provedor de identidade (IdP) central; os protocolos comuns são SAML 2.0 e OpenID Connect. Vantagem: usabilidade e gestão centralizada. Risco: ponto único de comprometimento, o que torna recomendável o MFA.'),

  q('seg', 'Sobre criptografia, assinale a opção correta.', [
    'A criptografia simétrica usa um par de chaves pública e privada.',
    'Funções hash são reversíveis com a chave correta.',
    'Na assinatura digital, o remetente cifra o hash da mensagem com sua chave PRIVADA, e o destinatário verifica com a chave PÚBLICA do remetente.',
    'O RSA é um algoritmo simétrico de bloco.',
    'O AES é um algoritmo assimétrico.',
  ], 'C', 'Simétrica (AES): uma chave, rápida. Assimétrica (RSA, ECC): par de chaves. Para confidencialidade, cifra-se com a PÚBLICA do destinatário; para assinatura, com a PRIVADA do remetente. Hash (SHA-256) é unidirecional.'),

  // ───────────────────────── BANCO DE DADOS E BI ─────────────────────────
  q('bd', 'Uma tabela com chave primária composta (A, B) possui o atributo C, que depende apenas de A. Essa tabela viola a:', [
    '1FN.', '2FN.', '3FN, mas está na 2FN.', 'FNBC, mas está na 3FN.', '4FN apenas.',
  ], 'B', '1FN: atributos atômicos, sem grupos repetitivos. 2FN: 1FN + nenhuma dependência PARCIAL da chave composta. 3FN: 2FN + nenhuma dependência TRANSITIVA (atributo não-chave → não-chave). FNBC: todo determinante é chave candidata.'),

  q('bd', 'Em SQL, a cláusula utilizada para filtrar GRUPOS resultantes de um GROUP BY, com base em funções de agregação, é:', [
    'WHERE.', 'HAVING.', 'ORDER BY.', 'DISTINCT.', 'LIMIT.',
  ], 'B', 'WHERE filtra LINHAS antes do agrupamento; HAVING filtra GRUPOS depois. Ordem lógica: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.'),

  q('bd', 'Assinale a opção que apresenta apenas comandos DDL.', [
    'SELECT, INSERT e UPDATE.', 'CREATE, ALTER e DROP.', 'GRANT e REVOKE.', 'COMMIT e ROLLBACK.', 'DELETE e TRUNCATE.',
  ], 'B', 'DDL: CREATE, ALTER, DROP, TRUNCATE (estrutura). DML: SELECT, INSERT, UPDATE, DELETE (dados). DCL: GRANT, REVOKE. TCL: COMMIT, ROLLBACK, SAVEPOINT.'),

  q('bd', 'Uma consulta precisa retornar TODOS os clientes, inclusive os que não possuem pedidos, com os dados do pedido quando houver. A junção adequada é:', [
    'INNER JOIN de clientes com pedidos.', 'clientes LEFT JOIN pedidos.', 'clientes RIGHT JOIN pedidos.', 'CROSS JOIN.', 'NATURAL JOIN obrigatoriamente.',
  ], 'B', 'LEFT JOIN mantém todas as linhas da tabela à esquerda; quando não há correspondência, as colunas da direita vêm com NULL. INNER retorna só o que casa; CROSS JOIN faz o produto cartesiano.'),

  q('bd', 'O nível de isolamento que impede leituras sujas (dirty reads), mas ainda permite leituras não repetíveis e fantasmas, é:', [
    'READ UNCOMMITTED.', 'READ COMMITTED.', 'REPEATABLE READ.', 'SERIALIZABLE.', 'SNAPSHOT obrigatório.',
  ], 'B', 'READ UNCOMMITTED permite tudo. READ COMMITTED impede dirty read. REPEATABLE READ também impede non-repeatable read, mas permite phantom. SERIALIZABLE impede todos. ACID = Atomicidade, Consistência, Isolamento, Durabilidade.'),

  q('bd', 'Sobre bancos NoSQL, assinale a opção correta.', [
    'Seguem estritamente as propriedades ACID em qualquer cenário.',
    'Utilizam sempre o modelo relacional.',
    'São adequados a cenários que exigem alta disponibilidade e escalabilidade horizontal, com modelos como documento, chave-valor, colunar e grafo.',
    'Armazenam dados sempre em grafos.',
    'São a melhor opção para sistemas ERP com transações complexas.',
  ], 'C', 'Tipos: documento (MongoDB), chave-valor (Redis, DynamoDB), colunar/wide-column (Cassandra, HBase), grafo (Neo4j). Em geral seguem BASE (consistência eventual). Teorema CAP: diante de partição de rede, escolhe-se entre consistência e disponibilidade.'),

  q('bd', 'Sobre bancos de dados em memória (in-memory), assinale a opção correta.', [
    'Armazenam os dados primariamente na memória RAM, oferecendo baixa latência; podem usar snapshots/logs para persistência.',
    'São incapazes de qualquer forma de persistência.',
    'São mais lentos que bancos em disco.',
    'Só armazenam dados relacionais.',
    'Não podem ser usados como cache.',
  ], 'A', 'Exemplos: Redis (com persistência por RDB/AOF), Memcached (apenas cache), SAP HANA. Usos: cache, sessões, filas, ranking. A durabilidade depende do mecanismo de persistência configurado.'),

  q('bd', 'Sobre Data Lake e Data Warehouse, assinale a opção correta.', [
    'O Data Lake exige esquema definido antes da carga (schema-on-write).',
    'O Data Lake armazena dados brutos, estruturados, semiestruturados e não estruturados, aplicando o esquema na leitura (schema-on-read).',
    'O Data Warehouse armazena apenas dados não estruturados.',
    'Ambos são sinônimos.',
    'O Data Warehouse não admite dados históricos.',
  ], 'B', 'DW = dados integrados, limpos, históricos, não voláteis e orientados a assunto (Inmon), schema-on-write. Data Lake = dados brutos, schema-on-read. Lakehouse combina os dois.'),

  q('bd', 'No modelo dimensional (Kimball), o esquema estrela caracteriza-se por:', [
    'tabelas de dimensão normalizadas em vários níveis.',
    'uma tabela fato central, com métricas e chaves estrangeiras, ligada a tabelas de dimensão desnormalizadas.',
    'ausência de tabela fato.',
    'uso exclusivo em sistemas OLTP.',
    'proibição de chaves substitutas (surrogate keys).',
  ], 'B', 'Estrela: fato com medidas numéricas + dimensões desnormalizadas. Floco de neve (snowflake): dimensões normalizadas. Kimball = bottom-up (data marts com dimensões conformadas); Inmon = top-down (EDW normalizado).'),

  q('bd', 'Em uma dimensão de clientes, a empresa quer manter o histórico das mudanças de endereço, criando um novo registro a cada alteração. Trata-se de uma SCD (Slowly Changing Dimension) do tipo:', [
    '0.', '1.', '2.', '3.', '4 com sobrescrita.',
  ], 'C', 'SCD 1 = sobrescreve (sem histórico). SCD 2 = nova linha, com vigência e surrogate key (histórico completo). SCD 3 = coluna adicional com o valor anterior (histórico limitado).'),

  q('bd', 'Em um cubo OLAP, a operação que navega de um nível mais detalhado para um mais agregado (ex.: de mês para ano) é:', [
    'Drill-down.', 'Roll-up (drill-up).', 'Slice.', 'Dice.', 'Pivot.',
  ], 'B', 'Drill-down = mais detalhe. Roll-up = agrega. Slice = fixa UMA dimensão em um valor (fatia). Dice = seleciona um subcubo com filtros em várias dimensões. Pivot = rotaciona os eixos. MOLAP/ROLAP/HOLAP são formas de armazenamento.'),

  q('bd', 'Sobre ETL e ELT, assinale a opção INCORRETA.', [
    'No ETL, os dados são transformados antes da carga no destino.',
    'O ETL é tradicionalmente usado em Data Warehouses.',
    'O ELT aproveita o poder de processamento do destino, transformando após a carga.',
    'O ELT é mais indicado quando o volume é pequeno e o destino tem pouca capacidade de processamento.',
    'O ELT é comum em Data Lakes e DWs em nuvem.',
  ], 'D', 'O ELT brilha com GRANDES volumes e destinos poderosos (cloud DW como BigQuery, Snowflake, Redshift). Item idêntico em espírito ao da FGV 2024 (questão de "assinale a incorreta").'),

  q('bd', 'Comparando abordagens relacional (OLTP) e multidimensional (OLAP), assinale a opção correta.', [
    'A multidimensional é mais eficiente para transações online de alta concorrência.',
    'A relacional normalizada é voltada a transações operacionais, enquanto a multidimensional facilita análises sobre grandes volumes organizados em dimensões e métricas.',
    'A relacional organiza os dados em cubos.',
    'A multidimensional não suporta agregações.',
    'OLAP e OLTP têm os mesmos objetivos.',
  ], 'B', 'OLTP: muitas transações curtas, normalizado, dados atuais. OLAP: consultas analíticas complexas, desnormalizado, histórico, agregações.'),

  q('bd', 'Sistemas de Suporte à Decisão (SSD) são mais caracteristicamente indicados para problemas:', [
    'exclusivamente estruturados e totalmente automatizáveis.',
    'semiestruturados, combinando modelos, dados e o julgamento do decisor, embora possam apoiar outros tipos.',
    'que dispensam qualquer dado.',
    'de uma única área funcional apenas.',
    'operacionais de rotina, como a emissão de notas fiscais.',
  ], 'B', 'A literatura clássica associa SSD a problemas semiestruturados. Atenção: na FGV 2024, o gabarito considerou que SSDs podem ser aplicados a problemas estruturados, semiestruturados e NÃO estruturados. Leia todas as alternativas e escolha a mais abrangente se ela não tiver absolutos falsos.'),

  q('bd', 'A integridade referencial em um banco relacional é garantida principalmente por:', [
    'índices não únicos.', 'chaves estrangeiras (FOREIGN KEY), que exigem que valores referenciados existam na tabela de origem.', 'views materializadas.', 'triggers obrigatoriamente.', 'colunas do tipo BLOB.',
  ], 'B', 'FK com ações ON DELETE/UPDATE: CASCADE, SET NULL, RESTRICT/NO ACTION. Integridade de entidade = PK não nula e única. Metadados (dicionário de dados) = "dados sobre dados".'),

  // ───────────────────────── GESTÃO E GOVERNANÇA ─────────────────────────
  q('gov', 'No COBIT 2019, os objetivos de GOVERNANÇA estão agrupados no domínio:', [
    'APO – Alinhar, Planejar e Organizar.', 'EDM – Avaliar, Dirigir e Monitorar.', 'BAI – Construir, Adquirir e Implementar.', 'DSS – Entregar, Servir e Suportar.', 'MEA – Monitorar, Avaliar e Analisar.',
  ], 'B', 'COBIT 2019 tem 40 objetivos. Governança (conselho): EDM. Gestão: APO, BAI, DSS e MEA. Separa governança (avaliar, dirigir, monitorar) de gestão (planejar, construir, executar, monitorar) e usa fatores de desenho (design factors).'),

  q('gov', 'São princípios orientadores da ITIL 4, EXCETO:', [
    'Foco no valor.', 'Comece de onde você está.', 'Progrida iterativamente com feedback.', 'Mantenha simples e prático.', 'Documente tudo antes de agir.',
  ], 'E', 'Os 7 princípios: foco no valor; comece de onde você está; progrida iterativamente com feedback; colabore e promova visibilidade; pense e trabalhe holisticamente; mantenha simples e prático; otimize e automatize. A ITIL 4 tem 4 dimensões, o SVS, a cadeia de valor (6 atividades) e 34 práticas.'),

  q('gov', 'Na ITIL 4, a diferença entre incidente e problema é que:', [
    'o incidente é a causa raiz; o problema é a interrupção percebida pelo usuário.',
    'o incidente é uma interrupção não planejada ou redução de qualidade; o problema é a causa (real ou potencial) de um ou mais incidentes.',
    'são sinônimos.',
    'o problema sempre exige mudança emergencial.',
    'o incidente só ocorre em hardware.',
  ], 'B', 'Gerenciamento de incidentes = restaurar o serviço o mais rápido possível. Gerenciamento de problemas = encontrar a causa raiz; erro conhecido = problema analisado e ainda não resolvido; workaround = solução de contorno.'),

  q('gov', 'Na notação BPMN, o elemento que representa a comunicação entre participantes de pools DIFERENTES é o:', [
    'Fluxo de sequência.', 'Fluxo de mensagem.', 'Associação.', 'Gateway exclusivo.', 'Raia (lane).',
  ], 'B', 'O fluxo de sequência liga elementos dentro do MESMO pool; o fluxo de mensagem liga pools diferentes. Gateways: exclusivo (X), paralelo (+), inclusivo (O) e baseado em eventos. Eventos (círculos): início, intermediário e fim.'),

  q('gov', 'Em gerenciamento de projetos, a diferença entre programa e portfólio é que:', [
    'o programa reúne projetos relacionados gerenciados de forma coordenada para obter benefícios; o portfólio reúne projetos, programas e operações para atingir objetivos estratégicos.',
    'o portfólio é um único projeto grande.',
    'o programa não tem relação entre os projetos.',
    'são sinônimos no PMBOK.',
    'o portfólio é sempre temporário com fim definido.',
  ], 'A', 'Projeto = esforço temporário para um resultado único. Programa = projetos relacionados (benefícios). Portfólio = alinhamento estratégico, sem necessariamente haver relação entre os componentes.'),

  // ───────────────────────── LEGISLAÇÃO ─────────────────────────
  q('leg', 'Segundo a LGPD, é considerado dado pessoal SENSÍVEL:', [
    'endereço residencial.', 'número de telefone.', 'dado referente à saúde ou à vida sexual.', 'endereço de e-mail corporativo.', 'número do CPF.',
  ], 'C', 'Art. 5º, II: origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização religiosa, filosófica ou política, dado de saúde ou vida sexual, dado genético ou biométrico, quando vinculado a uma pessoa natural.'),

  q('leg', 'Na LGPD, a pessoa indicada pelo controlador e pelo operador para atuar como canal de comunicação entre o controlador, os titulares e a ANPD é o:', [
    'operador.', 'encarregado.', 'titular.', 'agente de tratamento.', 'auditor externo.',
  ], 'B', 'Controlador = toma as decisões sobre o tratamento. Operador = trata em nome do controlador. Agentes de tratamento = controlador + operador. Encarregado (DPO) = canal de comunicação. Titular = a pessoa natural a quem os dados se referem.'),

  q('leg', 'De acordo com a LGPD, o dado anonimizado:', [
    'é sempre considerado dado pessoal sensível.',
    'não é considerado dado pessoal, salvo quando o processo de anonimização puder ser revertido com esforços razoáveis.',
    'exige consentimento específico para cada uso.',
    'deve ser eliminado em 15 dias.',
    'só pode ser tratado pelo poder público.',
  ], 'B', 'Art. 12. Pseudonimização ≠ anonimização: o dado pseudonimizado ainda é dado pessoal, pois pode ser reassociado com informação adicional mantida separadamente.'),

  q('leg', 'A sanção de multa simples prevista na LGPD é de até:', [
    '1% do faturamento, limitada a R$ 10 milhões por infração.', '2% do faturamento da pessoa jurídica no Brasil no último exercício, limitada a R$ 50 milhões por infração.', '5% do faturamento global, sem limite.', 'R$ 100 mil por infração.', '10% do lucro líquido.',
  ], 'B', 'Art. 52 (Cap. VIII – Fiscalização): advertência, multa simples (2% / R$ 50 mi), multa diária, publicização, bloqueio, eliminação, suspensão parcial do banco de dados, suspensão da atividade e proibição parcial ou total do tratamento. O Cap. IX trata da ANPD e do CNPD; o Cap. VII, de segurança e boas práticas.'),

  q('leg', 'NÃO é base legal para tratamento de dados pessoais (art. 7º da LGPD):', [
    'consentimento do titular.', 'cumprimento de obrigação legal ou regulatória.', 'legítimo interesse do controlador.', 'proteção do crédito.', 'interesse comercial de terceiros sem relação com o titular, independentemente de qualquer hipótese legal.',
  ], 'E', 'As 10 bases do art. 7º: consentimento, obrigação legal, administração pública (políticas públicas), estudos por órgão de pesquisa, execução de contrato, exercício regular de direitos, proteção da vida, tutela da saúde, legítimo interesse e proteção do crédito.'),

  q('leg', 'Pela Lei de Acesso à Informação (Lei 12.527/2011), não sendo possível conceder o acesso imediato, o órgão deverá responder em prazo de até:', [
    '10 dias, improrrogáveis.', '20 dias, prorrogáveis por mais 10 dias mediante justificativa.', '30 dias, prorrogáveis por mais 30.', '5 dias úteis.', '60 dias.',
  ], 'B', 'Art. 11. O pedido não precisa de motivação (são vedadas exigências quanto aos motivos). O serviço é gratuito, salvo o custo de reprodução. Recurso em até 10 dias. Graus de sigilo: ultrassecreta 25 anos (prorrogável uma vez), secreta 15 anos, reservada 5 anos.'),

  q('leg', 'Segundo a LAI, o prazo máximo de restrição de acesso à informação classificada como SECRETA é de:', [
    '5 anos.', '10 anos.', '15 anos.', '25 anos.', '50 anos.',
  ], 'C', 'Ultrassecreta: 25 anos. Secreta: 15. Reservada: 5. Informações pessoais relativas à intimidade têm acesso restrito por até 100 anos.'),

  q('leg', 'Pelo Marco Civil da Internet (Lei 12.965/2014), o provedor de CONEXÃO deve manter os registros de conexão, sob sigilo, pelo prazo de:', [
    '6 meses.', '1 ano.', '2 anos.', '5 anos.', 'indeterminado.',
  ], 'B', 'Registros de conexão: 1 ano (art. 13). Registros de acesso a aplicações: 6 meses, pelo provedor de aplicação constituído como pessoa jurídica com fins econômicos (art. 15). O provedor de conexão é PROIBIDO de guardar registros de acesso a aplicações (art. 14). A neutralidade de rede está no art. 9º.'),

  q('leg', 'O princípio do Marco Civil que obriga o tratamento isonômico de quaisquer pacotes de dados, sem distinção por conteúdo, origem e destino, serviço, terminal ou aplicação, é a:', [
    'guarda de registros.', 'neutralidade de rede.', 'inimputabilidade da rede.', 'portabilidade.', 'autodeterminação informativa.',
  ], 'B', 'Art. 9º (Cap. III, Seção I). As exceções (discriminação ou degradação) só são admitidas por requisitos técnicos indispensáveis ou para priorizar serviços de emergência, regulamentados por decreto.'),

  q('leg', 'A Lei 12.737/2012 ("Lei Carolina Dieckmann"), em seu art. 2º, inseriu no Código Penal o crime de:', [
    'estelionato eletrônico.', 'invasão de dispositivo informático.', 'pornografia infantil na internet.', 'racismo em redes sociais.', 'lavagem de dinheiro com criptoativos.',
  ], 'B', 'Art. 154-A do CP: invadir dispositivo informático alheio para obter, adulterar ou destruir dados sem autorização, ou instalar vulnerabilidades para obter vantagem ilícita. Também pune quem produz, oferece ou distribui programa destinado a isso. A pena foi aumentada pela Lei 14.155/2021.'),

  // ───────────────────────── IA / ATUALIDADES ─────────────────────────
  q('ia', 'Um modelo é treinado com e-mails previamente rotulados como "spam" ou "não spam". Trata-se de aprendizado:', [
    'não supervisionado.', 'supervisionado.', 'por reforço.', 'por agrupamento (clustering).', 'simbólico sem dados.',
  ], 'B', 'Supervisionado: dados rotulados, para classificação ou regressão. Não supervisionado: sem rótulo (clustering, redução de dimensionalidade). Por reforço: agente + ambiente + recompensa.'),

  q('ia', 'Sobre modelos de linguagem de grande porte (LLMs), assinale a opção correta.', [
    'Sempre produzem informações factualmente corretas.',
    'Baseiam-se, em geral, na arquitetura Transformer e podem gerar respostas plausíveis, porém incorretas ("alucinações").',
    'Não utilizam redes neurais.',
    'São treinados exclusivamente por aprendizado por reforço sem dados textuais.',
    'Dispensam qualquer cuidado com privacidade.',
  ], 'B', 'Transformer (mecanismo de atenção), processamento em tokens, pré-treino + ajuste fino (fine-tuning) + RLHF. O RAG (Retrieval-Augmented Generation) consulta fontes externas para reduzir alucinações.'),

  q('ia', 'O fenômeno em que um modelo se ajusta excessivamente aos dados de treino, com bom desempenho neles e desempenho ruim em dados novos, é o:', [
    'underfitting.', 'overfitting.', 'data drift.', 'feature scaling.', 'cross-validation.',
  ], 'B', 'Overfitting = memoriza o treino, generaliza mal. Underfitting = modelo simples demais. Mitigações: mais dados, regularização, validação cruzada, early stopping, dropout.'),

  q('ia', 'Em ética e governança de IA, a preocupação com modelos que reproduzem discriminação presente nos dados de treinamento refere-se a:', [
    'explicabilidade.', 'viés algorítmico.', 'latência.', 'escalabilidade horizontal.', 'compressão de modelos.',
  ], 'B', 'Pilares de IA responsável: justiça (mitigar viés), transparência e explicabilidade, privacidade (relacionada à LGPD), segurança, responsabilização e supervisão humana. Regulações seguem abordagem baseada em risco (EU AI Act; PL 2338/2023 no Brasil).'),

  // ───────────────────────── RACIOCÍNIO LÓGICO ─────────────────────────
  q('rlm', 'A negação de "Se chove, então a rua fica molhada" é:', [
    'Se não chove, então a rua não fica molhada.', 'Chove e a rua não fica molhada.', 'Não chove ou a rua fica molhada.', 'Não chove e a rua fica molhada.', 'Se a rua não fica molhada, então não chove.',
  ], 'B', '~(P→Q) ≡ P ∧ ~Q ("mantém o primeiro E nega o segundo"). Equivalências de P→Q: ~Q→~P (contrapositiva) e ~P ∨ Q. "Se a rua não fica molhada, então não chove" é EQUIVALENTE à original (contrapositiva), não a negação.'),

  q('rlm', 'A negação de "Todos os analistas são programadores" é:', [
    'Nenhum analista é programador.', 'Algum analista não é programador.', 'Todos os analistas não são programadores.', 'Algum programador não é analista.', 'Algum analista é programador.',
  ], 'B', 'Negação de "Todo A é B" = "Algum A não é B". Negação de "Nenhum A é B" = "Algum A é B". Negação de "Algum A é B" = "Nenhum A é B".'),

  q('rlm', 'A proposição "P ou Q" (disjunção inclusiva) é FALSA somente quando:', [
    'P é verdadeira e Q é falsa.', 'P e Q são verdadeiras.', 'P e Q são falsas.', 'P é falsa e Q é verdadeira.', 'nunca é falsa.',
  ], 'C', 'Conectivos: ∨ é falso só se ambos forem falsos; ∧ é verdadeiro só se ambos forem verdadeiros; → é falso só em V→F; ↔ é verdadeiro quando os valores são iguais. Negação de (P ∧ Q) = ~P ∨ ~Q; de (P ∨ Q) = ~P ∧ ~Q (De Morgan).'),

  q('rlm', 'Uma tabela-verdade de uma proposição composta por 4 proposições simples distintas possui quantas linhas?', [
    '4', '8', '12', '16', '32',
  ], 'D', 'Número de linhas = 2^n. Com n = 4, são 16 linhas. Tautologia = sempre V; contradição = sempre F; contingência = varia.'),

  // ───────────────────────── PORTUGUÊS / INGLÊS ─────────────────────────
  q('ling', 'Assinale a frase em que o sinal indicativo de crase está empregado CORRETAMENTE.', [
    'O sistema começou à funcionar ontem.', 'Entregamos o relatório à diretoria.', 'Ficamos frente à frente com o problema.', 'A reunião será à partir das 14h.', 'Refiro-me à esse documento.',
  ], 'B', 'Crase = preposição "a" + artigo "a" diante de palavra feminina ("entregar algo A + A diretoria"). Não há crase antes de verbo (a funcionar), de pronome demonstrativo "esse" nem em "a partir de"; em expressões com palavras repetidas também não (frente a frente, cara a cara).'),

  q('ling', 'Assinale a frase CORRETA quanto à concordância verbal.', [
    'Haviam muitos erros no código.', 'Fazem dois anos que o sistema foi implantado.', 'Houve muitos erros no código.', 'Devem haver soluções melhores.', 'Existe vários problemas na API.',
  ], 'C', '"Haver" com sentido de existir é impessoal: fica no singular (houve, havia), e o auxiliar também (deve haver). "Fazer" indicando tempo é impessoal (faz dois anos). Já "existir" é pessoal e concorda: "existem vários problemas".'),

  q('ling', 'In the sentence "The deployment was postponed; however, the team kept testing the new features", the word "however" expresses:', [
    'addition.', 'contrast.', 'cause.', 'example.', 'time sequence.',
  ], 'B', 'However/nevertheless/yet/although/whereas = contraste. Moreover/furthermore/in addition = adição. Therefore/thus/hence = conclusão ou consequência. Because/since/due to = causa. Atenção a falsos cognatos: "actually" = na verdade; "eventually" = finalmente; "pretend" = fingir.'),

  q('ling', 'The sentence "Developers should have tested the API before releasing it" means that the developers:', [
    'tested the API and it worked.', 'did not test the API, which was a mistake.', 'will test the API tomorrow.', 'are not allowed to test the API.', 'always test APIs before releasing them.',
  ], 'B', '"Should have + particípio" expressa crítica ou arrependimento sobre algo que NÃO aconteceu no passado. Modais: must = obrigação ou dedução forte; might/may = possibilidade; could have = possibilidade passada não realizada.'),
];
