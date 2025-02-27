# 메타모스트 + 구글 캘린더 Bot
![image](https://github.com/user-attachments/assets/2879464a-7705-4150-bd77-c3998fa046ee)

## 소개

- 사내의 채팅 메신저 `메타모스트`를 통해 무료로 채팅 봇을 사용하기 위해서 제작
- 주중 매일 오전 08시 30분 오늘의 회의 일정과 휴가자 목록을 봇이 가져옵니다.
- `Slash Command` 기능 `/today` 를 채팅창에 입력하면 오늘의 회의 일정과 휴가자 목록을 가져옵니다.
- `AWS`의 `Lambda`로 구현이 가능하지만 무료로 사용하기 위해서 `Google Apps Script`를 활용하여 구글 캘린더의 일정을 가져와 휴가자와 오늘의 회의 일정을 가져옵니다.
- 부가적인 기능으로 `Slack`의 `Slash Command` 기능이 `메타모스트`에도 존재하기 때문에 구현을 해놓았고 언제든지 일정을 계속 받아 볼 수 있습니다.

## 1. 개발 환경

- Tool : Mattermost, Google Calendar, Google Apps Script, JS

## 2. 채택한 이유

- Mattermost
  - 사내 외부 메신저로 `Slack`을 대신하여 활용하고 있으며 동일한 기능이 똑같이 존재합니다.
- Google Calendar
  - 사내 회의 일정 및 휴가자 관리를 `Google Calendar`로 관리를 하고 있기 때문에 해당 API의 기능을 가져다 활용을 했습니다.
- Google Apps Script + JS
  - `AWS`의 `Lambda`로 구현이 가능하지만 비용 절감으로 인한 무료로 사용하기 위해서 `Google Apps Script`를 활용하여 구글 캘린더의 일정을 가져와 휴가자와 오늘의 회의 일정을 가져옵니다.
