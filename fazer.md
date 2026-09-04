Quero criar um sistema web chamado "Pace Training" para gerenciamento de treinos de corrida e sincronização com relógios Garmin.

OBJETIVO PRINCIPAL

O sistema deve permitir que eu receba semanalmente um PDF de treino do meu treinador, como o modelo anexado/referenciado nesta conversa, e transforme automaticamente o conteúdo do PDF em uma semana de treinos organizada.

Porém, NÃO quero depender somente do PDF.

Eu também quero poder criar, editar, excluir e adicionar treinos MANUALMENTE em qualquer dia da semana.

Depois de revisar a semana inteira, quero clicar em um botão para sincronizar os treinos estruturados com minha conta Garmin, usando a integração oficial da Garmin quando disponível/aprovada.

IMPORTANTE:
Não utilizar scraping, automação de navegador, captura de senha ou métodos não oficiais para acessar o Garmin Connect.
A arquitetura deve ser preparada para utilizar a Garmin Training API oficial.

==================================================
1. VISUAL DO SISTEMA
==================================================

Criar uma interface moderna, profissional e voltada para atletas de corrida.

Estilo:
- Dark mode como padrão
- Fundo preto/grafite
- Azul como cor principal
- Cards modernos
- Bordas discretas
- Interface responsiva para celular e computador
- Visual semelhante a plataformas profissionais de treinamento esportivo

Nome:
PACE TRAINING

Subtítulo:
"Seu treinamento. Organizado. Estruturado. No seu Garmin."

==================================================
2. DASHBOARD PRINCIPAL
==================================================

Criar uma tela inicial mostrando:

- Semana atual
- Data inicial e final
- Quilometragem planejada
- Quilometragem dos treinos cadastrados
- Número de treinos
- Dias de descanso
- Treinos sincronizados
- Treinos ainda não sincronizados

Exemplo:

SEMANA
07/09/2026 → 13/09/2026

VOLUME PLANEJADO
≈ 90 km

TREINOS
12

SINCRONIZADOS
8

PENDENTES
4

==================================================
3. CALENDÁRIO SEMANAL
==================================================

Criar uma visualização de segunda a domingo.

Cada dia deve mostrar:

SEGUNDA
18 km

Manhã
- 10 km leve
- Pace 4:40–5:10/km

Tarde
- 8 km regenerativo
- Pace 5:10–5:40/km

Cada treino deve ser um card clicável.

Permitir:
- adicionar treino
- editar treino
- duplicar treino
- excluir treino
- mover treino para outro dia
- mudar horário
- marcar como descanso

==================================================
4. IMPORTAÇÃO DO PDF
==================================================

Criar botão:

"+ IMPORTAR PDF"

O usuário envia o PDF do treinador.

O sistema deve:

1. Ler o PDF
2. Extrair o texto
3. Identificar automaticamente:
   - semana
   - datas
   - dias da semana
   - distância
   - duração
   - pace
   - ritmo
   - séries
   - repetições
   - recuperação
   - aquecimento
   - desaquecimento
   - fartlek
   - tiros
   - coordenados
   - treino controlado
   - treino longo
   - regenerativo
   - musculação/halteres
   - descanso

3. Converter o conteúdo para uma estrutura interna de treino.

NÃO enviar automaticamente para o Garmin logo após importar o PDF.

Primeiro mostrar uma tela:

"TREINOS IDENTIFICADOS"

O usuário deverá revisar e confirmar.

==================================================
5. EXEMPLO DE PDF
==================================================

O sistema deve conseguir interpretar PDFs semelhantes a este formato:

PAULO HENRIQUE — PLANO SEMANAL

FOCO: 5 KM / 10 KM
OBJETIVO: BASE AERÓBIA • VOLUME • BAIXA INTENSIDADE

SEGUNDA
18 km

Manhã:
10 km leve

Tarde:
8 km regenerativo

TERÇA
17 km

Manhã:
10 km leve + 6×100 m coordenados

Tarde:
6 km leve + 1 km a 3:50–4:00/km

QUARTA
≈12 km

Manhã:
9 km leve

Tarde:
20 min leve + halteres + 10 min fartlek 1'/1'

QUINTA
≈12 km

Manhã:
10 km leve + 2 km a 3:50–4:00/km

Tarde:
30 min leve

SEXTA
16 km

Manhã:
8 km leve

Tarde:
8 km regenerativo

SÁBADO
16 km

Manhã:
16 km longo confortável

DOMINGO
DESCANSO

REFERÊNCIAS:

Leve: 4:40–5:10/km
Regenerativo: 5:10–5:40/km
Longo: 4:45–5:15/km
Controlado: 3:50–4:00/km

O sistema deve reconhecer esse tipo de estrutura, mas também funcionar quando o PDF tiver pequenas diferenças de formatação.

==================================================
6. ADIÇÃO MANUAL DE TREINO
==================================================

Criar botão:

"+ ADICIONAR TREINO"

Eu devo conseguir escolher:

- Dia
- Data
- Horário
- Modalidade
- Distância
- Duração
- Pace
- Zona de frequência cardíaca
- Potência, se aplicável
- Observações

Tipos de treino:

- Corrida
- Aquecimento
- Desaquecimento
- Recuperação
- Intervalado
- Fartlek
- Tempo/Controlado
- Longão
- Regenerativo
- Coordenados/Strides
- Descanso
- Força/Halteres

==================================================
7. TREINOS ESTRUTURADOS
==================================================

O sistema deve permitir criar treinos complexos.

Exemplo:

5 VEZES

CORRIDA
1:00
Pace: 3:20–3:25/km

RECUPERAÇÃO
1:00
Pace: 5:10–5:40/km

Isso deve ser armazenado como:

REPEAT
repetitions: 5

STEP 1:
type: RUN
duration: 60 seconds
target: PACE
min: 3:20/km
max: 3:25/km

STEP 2:
type: RECOVERY
duration: 60 seconds
target: PACE
min: 5:10/km
max: 5:40/km

O sistema deve permitir adicionar quantas etapas forem necessárias.

==================================================
8. EXEMPLOS DE TREINOS QUE PRECISAM FUNCIONAR
==================================================

Exemplo 1:

10 km leve
Pace 4:40–5:10/km

Exemplo 2:

20 min leve

+

5×:

1 min a 3:20–3:25/km
1 min recuperação a 5:10–5:40/km

Exemplo 3:

Aquecimento
2 km leve

+

6×400 m
Pace 3:10/km

Recuperação:
1:30

+

Desaquecimento
2 km

Exemplo 4:

6 km leve

+

1 km controlado
3:50–4:00/km

Exemplo 5:

6×100 m coordenados

Exemplo 6:

16 km longo confortável
4:45–5:15/km

==================================================
9. ESTIMATIVA DE DISTÂNCIA
==================================================

Quando o treino tiver duração + pace, calcular uma distância estimada.

Exemplo:

1 minuto a 3:20/km
≈ 0,30 km

1 minuto a 5:25/km
≈ 0,18 km

Mostrar:

DISTÂNCIA ESTIMADA: 2,4 km

Mas deixar claro que é uma estimativa.

Não alterar silenciosamente a distância definida pelo treinador.

==================================================
10. RESUMO DA SEMANA
==================================================

Calcular automaticamente:

- Volume total
- Volume por dia
- Volume por período (manhã/tarde)
- Número de sessões
- Número de dias treinados
- Número de dias de descanso

Exemplo:

SEG 18 km
TER 17 km
QUA 12 km
QUI 12 km
SEX 16 km
SÁB 16 km
DOM descanso

TOTAL:
≈ 91 km

Se o PDF disser "≈90 km", preservar também a informação original do treinador.

==================================================
11. EDITOR DA SEMANA
==================================================

Criar uma tela:

EDITAR SEMANA

Data inicial: __/__/____
Data final: __/__/____

[ SEG ] [ TER ] [ QUA ] [ QUI ] [ SEX ] [ SÁB ] [ DOM ]

Eu devo poder modificar qualquer coisa manualmente.

Exemplo:

O PDF trouxe:

TERÇA:
10 km leve

Eu posso clicar:

EDITAR

e alterar para:

12 km leve

ou adicionar:

+

5×1 min forte / 1 min recuperação

A semana deve ser atualizada automaticamente.

==================================================
12. STATUS DOS TREINOS
==================================================

Cada treino deve possuir status:

RASCUNHO
CONFIRMADO
PRONTO PARA SINCRONIZAR
ENVIADO PARA GARMIN
SINCRONIZADO
ERRO

Mostrar visualmente esses estados.

==================================================
13. INTEGRAÇÃO COM GARMIN
==================================================

Criar uma área:

⌚ GARMIN CONNECT

Status:

"Garmin não conectado"

Botão:

[ CONECTAR GARMIN ]

A arquitetura deve ser preparada para OAuth/autorização oficial da Garmin.

NUNCA pedir ao usuário a senha do Garmin dentro do sistema.

Depois da conexão:

GARMIN CONECTADO ✓

Mostrar:

Conta conectada
Última sincronização
Quantidade de treinos enviados

==================================================
14. SINCRONIZAÇÃO
==================================================

Criar botão:

[ SINCRONIZAR SEMANA COM GARMIN ]

Ao clicar:

1. Validar todos os treinos
2. Verificar se possuem estrutura válida
3. Mostrar quais serão enviados
4. Enviar os treinos pela integração oficial disponível
5. Atualizar o status

Exemplo:

12 treinos encontrados

✓ Segunda — 10 km leve
✓ Segunda — 8 km regenerativo
✓ Terça — 10 km leve
✓ Terça — 6×100 m
✓ Terça — 6 km + 1 km controlado
...

[ CONFIRMAR SINCRONIZAÇÃO ]

==================================================
15. EVITAR DUPLICAÇÃO
==================================================

O sistema deve impedir que eu envie o mesmo treino duas vezes.

Cada treino deve possuir um ID único.

Antes de enviar:

"Este treino já foi sincronizado."

Mostrar opção:

[ NÃO ENVIAR ]
[ ATUALIZAR TREINO ]

Se eu editar um treino que já foi sincronizado, mostrar:

"Este treino foi alterado depois da sincronização."

E permitir atualizar o treino, caso a integração oficial permita.

==================================================
16. BANCO DE DADOS
==================================================

Criar banco de dados organizado.

Entidades principais:

USERS

WEEKS

TRAINING_DAYS

WORKOUTS

WORKOUT_STEPS

WORKOUT_REPEATS

GARMIN_CONNECTIONS

SYNC_LOGS

PDF_IMPORTS

WORKOUT_TEMPLATES

==================================================
17. MODELO DE WORKOUT
==================================================

Criar uma estrutura interna flexível.

Exemplo:

{
  "date": "2026-09-08",
  "time": "18:00",
  "sport": "RUNNING",
  "name": "Fartlek 5x1'/1'",
  "steps": [
    {
      "type": "RUN",
      "duration": 60,
      "target_type": "PACE",
      "target_min": "3:20",
      "target_max": "3:25"
    },
    {
      "type": "RECOVERY",
      "duration": 60,
      "target_type": "PACE",
      "target_min": "5:10",
      "target_max": "5:40"
    }
  ],
  "repeat": 5
}

A estrutura deve ser independente do Garmin.

Depois criar um adaptador:

Internal Workout
        ↓
Garmin Workout Format/API

Assim o sistema não fica totalmente dependente da Garmin.

==================================================
18. TEMPLATES
==================================================

Permitir salvar treinos como modelos.

Exemplo:

"5×1'/1'"

"6×400m"

"10 km leve"

"Longão 16 km"

Depois eu posso reutilizar o treino em outra semana.

==================================================
19. HISTÓRICO
==================================================

Criar histórico de semanas.

Exemplo:

SEMANA 01
01/09 → 07/09
90 km

SEMANA 02
08/09 → 14/09
92 km

SEMANA 03
15/09 → 21/09
85 km

Ao abrir uma semana, visualizar todos os treinos.

==================================================
20. TECNOLOGIA
==================================================

Escolha uma stack moderna e estável.

Preferência:

Frontend:
React + TypeScript

UI:
Tailwind CSS

Backend:
Node.js + TypeScript

Banco:
PostgreSQL

ORM:
Prisma

PDF:
biblioteca confiável para extração de texto de PDF

IA:
criar uma camada separada para interpretação dos PDFs.

IMPORTANTE:

Não colocar chaves de API diretamente no frontend.

Usar variáveis de ambiente.

Criar .env.example.

==================================================
21. ARQUITETURA
==================================================

Separar claramente:

/frontend
/backend
/database
/services
/garmin
/pdf-parser
/ai
/workout-engine

Criar um serviço:

WorkoutParser

Responsável por transformar o texto do PDF em treino estruturado.

Criar:

WorkoutEngine

Responsável por criar e validar treinos.

Criar:

GarminService

Responsável pela futura integração oficial com Garmin.

Criar:

SyncService

Responsável pelo envio e controle de sincronização.

==================================================
22. IMPORTANTE SOBRE GARMIN
==================================================

Não implementar login por scraping.

Não armazenar senha Garmin.

Não tentar burlar autenticação.

Usar somente APIs oficiais/documentadas quando disponíveis.

Se a Garmin exigir aprovação para a Training API, criar a integração de forma modular e deixar uma camada MOCK funcionando para desenvolvimento.

Assim posso testar todo o sistema mesmo antes da aprovação da Garmin.

==================================================
23. MODO MOCK
==================================================

Criar:

GARMIN MOCK MODE

Quando ativado:

[ SINCRONIZAR ]

simula o envio e muda:

PRONTO PARA SINCRONIZAR

para:

SINCRONIZADO ✓

Mostrar logs:

14:32:01
Workout criado

14:32:02
Workout enviado

14:32:03
Sincronização concluída

Isso permitirá testar toda a aplicação antes da integração real.

==================================================
24. EXPERIÊNCIA PRINCIPAL
==================================================

Quero que o fluxo principal seja extremamente simples:

1. Recebo PDF do treinador.

2. Abro o Pace Training.

3. Clico:
IMPORTAR PDF

4. Sistema interpreta o PDF.

5. Sistema monta automaticamente:

SEG
TER
QUA
QUI
SEX
SÁB
DOM

6. Eu reviso.

7. Posso adicionar/modificar qualquer treino manualmente.

8. Clico:

CONFIRMAR SEMANA

9. Sistema valida todos os treinos.

10. Clico:

SINCRONIZAR COM GARMIN

11. Os treinos são enviados pela integração oficial.

12. O Garmin Connect sincroniza com o relógio compatível.

==================================================
25. REGRAS IMPORTANTES
==================================================

- Nunca alterar silenciosamente o treino original do PDF.
- Manter o PDF original armazenado.
- Mostrar diferenças quando eu editar um treino importado.
- Permitir desfazer alterações.
- Permitir editar tudo manualmente.
- Permitir criar treino do zero.
- Permitir duplicar treino.
- Permitir excluir treino.
- Permitir mudar data.
- Permitir mudar horário.
- Permitir adicionar sessões de manhã/tarde/noite.
- Calcular volume automaticamente.
- Não enviar nada para Garmin sem confirmação do usuário.
- Evitar duplicação.
- Registrar logs de sincronização.
- Preparar integração Garmin de maneira modular.
- Criar modo MOCK para desenvolvimento.
- Interface mobile-first.
- Código limpo e organizado.
- Validar dados antes de sincronizar.

==================================================
26. ENTREGA
==================================================

Não quero somente uma demonstração visual.

Quero construir uma aplicação funcional.

Primeiro implemente:

FASE 1
- Dashboard
- Calendário semanal
- CRUD de semanas
- CRUD de treinos
- Editor de treino estruturado
- Banco de dados
- Cálculo de volume

FASE 2
- Upload de PDF
- Extração de texto
- Parser de treino
- IA para interpretação
- Tela de revisão

FASE 3
- Workout Engine
- Validação
- Templates
- Histórico

FASE 4
- GarminService
- OAuth
- Garmin Training API
- Sincronização
- Logs
- Modo MOCK

Antes de escrever grandes quantidades de código, analise a arquitetura e crie a estrutura inicial do projeto.

Depois implemente a aplicação por fases, garantindo que cada fase funcione antes de avançar para a próxima.

O resultado final deve permitir que eu receba um PDF semanal como o exemplo, importe, revise, altere/adicione qualquer treino e, quando a integração Garmin oficial estiver disponível e autorizada, sincronize a semana inteira com minha conta Garmin.