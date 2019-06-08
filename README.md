# REMEDY-SERVER


### 개요
본 프로젝트는 2019년 컴퓨터공학과 캡스톤 프로젝트로서 비정형데이터의 정형데이터화에 의의가 있습니다. 여기서 말한 비정형 데이터란 pdf이며 정형데이터는 json등의 데이터를 의미합니다. 본 레포지토리는 API서버입니다. 프론트엔드 레포지토리는 다음과 같습니다 [프론트엔드 레포지토리](https://github.com/remody/remody-dashboard)

### 기능
기능은 다음과 같습니다.
1. 로그인&아웃, 회원가입, 탈퇴등의 회원관리를 합니다.
2. Word2Vec을 써서 비슷한 유사어를 찾아 줍니다.
3. ES(Elastic Search)를 써서 pdf 본문 검색을 하게 해줍니다.
4. Graphql에 의거한 통신을 합니다.
5. 간단한 파일 업로드가 가능합니다.
6. 이메일을 보내 비밀번호 찾기를 지원합니다.

사용방법
기초 설정 파일을 만들어 줍니다. 예시는 다음과 같습니다
```bash
export REMODY_SECRET="yoursecret"
export REMODY_EMAIL_USER="yourid@gmail.com"
export REMODY_EMAIL_PASSWORD="yourgmailpassword"
export RDS_HOSTNAME="yourrdshost.com"
export RDS_USERNAME="rdsname"
export RDS_PASSWORD="yourdbpassword"
export RDS_PORT="dbport"
export RDS_MAINDB="maindb"
export ES_HOST="your-es.host.com"
export ES_PORT="9200"

```
ES 및 DB(MYSQL)는 로컬에서 사용하셔도 문제 없습니다. 그리고 이메일을 설정하시려면 다음의 주소를 참고해주세요.
1. [구글 어카운트 설정](https://myaccount.google.com/lesssecureapps)
2. [캡차 설정](https://accounts.google.com/DisplayUnlockCaptcha)

이렇게 해주시고 다음처럼 해주시면 됩니다
1. yarn(패키지를 설치해줍니다.)
2. yarn start(서버를 실행 시켜줍니다)
혹시 개발을 하시려면 yarn develop을 해주시면 됩니다.

### 개발 스택
1. Nginx
2. graphql
3. prisma
4. jwt
5. graphql-yoga
6. Elastic Search
7. Python-Shell

### 이 스택을 쓴이유
1. Nginx
> 리버스 프록시로 더욱 안전하게 서비스 하기 위해<br/>
> 클러스터링을 구현하기 위해<br/>
> 리액트 정적 데이터를 서비스 하기 위해

2. graqhql & graphql-yoga
> 언더페칭과 오버페칭을 막고 원하는 정보만 얻기 위해서<br />
> 릴레이션이 있는 관계의 것을 바로 얻어올 수 있기에<br />
> 페이지네이션을 쉽게 구현 할 수 있기에<br />
> 엔드포인트가 하나라 API마다 설계할 수고를 줄여주기에

3. primsa
> graphql은 백엔드와 프론트 엔드 사이의 간격을 줄여주기 위해 사용하는 것이지만 프리즈마를 사용한다면 백엔드와 디비 사이의 언더페칭과 오버페칭을 줄여준다.<br />
> 간단한 타입 설정만으로 원하는 디비에 설정이 가능하다<br />
> 프로토 타입 같은 경우에는 간단하게 호스팅 받아서 사용이 가능하다

4. jwt
> 따로 세션을 관리하지 않고 토큰을 주어 유저 관리가 가능해짐<br />
> 안정성이 높음 <br />
> 로컬스토리지에 저장하여 API요청을 보낼때마다 헤더에 담아서 보낼수 있음

5. Elastic Search
> 해쉬테이블을 사용하여 빠른 검색이 가능합니다. <br />
> 한국어 플러그인 노리를 사용하여 형태소 분석이 가능하여 조금 더 연관성이 높음 검색 결과를 반환합니다. <br />
> 키바나, 헤드, 로그스태쉬를 추가하면 로그 분석이 용이해집니다.

6. Python-Shell
> 노드에서도 파이썬을 돌릴 수 있게 해줍니다.
