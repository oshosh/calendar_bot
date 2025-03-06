const GOOGLE_CALENDAR_BOT_NAME = '오늘의 일정 봇';
const GOOGLE_CALENDAR_VACATION_BOT_NAME = '휴가자 알림이 봇';
const GOOGLE_CALENDAR_ID = "";
const WEBHOOK_ID = "";


function sendToMattermost(message) {
  const payload = {
    text: message
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(WEBHOOK_ID, options);
  console.log("Response: ", response.getContentText()); // 응답 로그 출력
  return response;
}

function scheduleEventTriggers() {
  // const calendar = CalendarApp.getDefaultCalendar();
  const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
  const now = new Date();
  const timeFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24시간 후까지의 이벤트를 조회

  const events = calendar.getEvents(now, timeFromNow);
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventStartTime = event.getStartTime();
    const timeBeforeEvent = new Date(eventStartTime.getTime() - 30 * 60 * 1000); // 이벤트 시작 30분 전
    console.log('뭐지', timeBeforeEvent)

    if (timeBeforeEvent > now) {
      ScriptApp.newTrigger('notifyEvent')
        .timeBased()
        .at(timeBeforeEvent)
        .create();
    }
  }
}

function notifyEvent() {
  // const calendar = CalendarApp.getDefaultCalendar();
  const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
  const now = new Date();
  const events = calendar.getEvents(now, new Date(now.getTime() + 60 * 1000)); // 현재 시간부터 1분 이내의 이벤트

  console.log(events)
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventStartTime = event.getStartTime();
    const eventTitle = event.getTitle();
    const eventDescription = event.getDescription();
    
    const message = `Upcoming Event: ${eventTitle}\nDescription: ${eventDescription}\nStarts at: ${eventStartTime}`;
    sendToMattermost(message);
  }
}

/**
 * 오전 7시 ~ 8시 사이 트리거를 만듬
 * 8시 30분에 todayEvent를 실행 시켜 휴가자 및 일정 조회를 실행 시킨다.
 */
const setTriggerTodayEvent = () => {
  const day = new Date();
  day.setHours(8);
  day.setMinutes(30);
  ScriptApp.newTrigger('todayEvent').timeBased().at(day).create();
}

const todayEvent = () => {
  const id = getGoogleCalendarID();
  
  todayGoogleCalendarBacationEvents(id); // 휴가자
  todayGoogleCalendarEvent(id); // 일정 조회
};

/**
 * 오후 11시 ~ 오전 12시 사이 트리거 생성
 * 24시가 되면 deleteTodayEvent를 실행 시켜 트리거를 전부 삭제한다.
 */
const setDeleteTriggerEvent = () => {
  const day = new Date();
  day.setHours(24);
  day.setMinutes(00);
  ScriptApp.newTrigger('deleteTodayEvent').timeBased().at(day).create();
}

const deleteTodayEvent = () => {
  const triggers = ScriptApp.getProjectTriggers();
  const keepFunctions = [
    'setTriggerTodayEvent',
    'setDeleteTriggerEvent',
    'setTriggerbegin30minAfterEvent',
    'scheduleMeetingReminders',
    'createTrigger'
  ];
  
  // 누적
  let functionCounts = {
    'setTriggerTodayEvent': 0,
    'setDeleteTriggerEvent': 0,
    // 'setTriggerbegin30minAfterEvent': 0
    'scheduleMeetingReminders': 0,
    'createTrigger': 0
  };

  for (let i = 0; i < triggers.length; i++) {
    const functionName = triggers[i].getHandlerFunction();
    if (keepFunctions.includes(functionName)) {
      functionCounts[functionName]++;
      if (functionCounts[functionName] > 1) {
        Logger.log('functionCounts가 두개 이상 있다면 하나는 삭제 ' + functionName);
        ScriptApp.deleteTrigger(triggers[i]);
      } else {
        Logger.log('keepFunctions 유지 시킬거...' + functionName);
      }
    } else {
      Logger.log('나머지 트리거는 삭제 : ' + functionName);
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}


const setTriggerbegin30minAfterEvent = () => {
  const day = new Date();
  day.setHours(8);
  day.setMinutes(30);
  ScriptApp.newTrigger('todayLoopEvent').timeBased().at(day).create();
}

// /**
//  * 30분 뒤에 일정 알림
//  */
// const todayLoopEvent = () => {
//   const id = getGoogleCalendarID();
//   begin30minAfterEvents(id)
// }

// const todayLoopEvent2 = () => {
//   const id = getGoogleCalendarID();
//   console.log('start');
//   begin30minAfterEvents(id)
// }

// const begin30minAfterEvents = (googleCalendarId) => {
//   const events = googleCalendarId.getEventsForDay(new Date());
  
//   // Check the current time
//   const now = new Date();
//   if (now.getHours() >= 20) {
//     Logger.log('It\'s 8 PM or later. Exiting the loop.');
//     return;
//   }

//   for(let i=0; i < events.length; i++) {
//     const currentTime = Utilities.formatDate(events[i].getStartTime(),"GMT+0900","YYYMMddHHmm") - Utilities.formatDate(new Date(),"GMT+0900","YYYMMddHHmm")
//     console.log(events[i].getTitle(), currentTime)
    
//     if(!events[i].isAllDayEvent() && Utilities.formatDate(events[i].getStartTime(),"GMT+0900","YYYMMddHHmm") - Utilities.formatDate(new Date(),"GMT+0900","YYYMMddHHmm") === 59) { 
//         msgBody = "##### "+ events[i].getTitle()+"\n";
//         msgBody += "- "+Utilities.formatDate(events[i].getStartTime(),"GMT+0900","YYYY년 MM월 dd일 HH시 mm분")+" ~ "+Utilities.formatDate(events[i].getEndTime(),"GMT+0900","MM월 dd일 HH시 mm분")+"\n";
//         msgBody += "- "+((events[i].getDescription())?events[i].getDescription():"내용 없음")+"\n\n";
//         msgBody += "###### 일정이 30분 후 시작 됩니다!";
        
//         const attachments = [
//           {
//             text: '일정 준비하세요!!!!!',
//             fields: [
//               {
//                 short: true,
//                 title: events[i].getTitle(),
//                 value: events[i].getDescription(),
//               },
//             ],
//           },
//         ];
//         postMattermostWebhook('', msgBody, attachments);
//     }

//     const triggers = ScriptApp.getProjectTriggers();
//     for (let i = 0; i < triggers.length; i++) {
//       if (triggers[i].getHandlerFunction() === 'todayLoopEvent2') {
//         ScriptApp.deleteTrigger(triggers[i]);
//       }
//     }

//     https://qiita.com/leechungkyu/items/d1130ae0b2fdff398f7c // 초단위 생성은 불가능한 것으로 보임... while 문도 문제가 있음
//     ScriptApp.newTrigger('todayLoopEvent2')
//             .timeBased()
//             .after(1000)
//             .create();
//   }
// }

const todayGoogleCalendarBacationEvents = (googleCalendarId) => {
  const morning4Half = googleCalendarId.getEventsForDay(new Date(), { search: "오전 반차" });
  const morning2Half = googleCalendarId.getEventsForDay(new Date(), { search: "오전 반반차" });
  const afternoon4Half = googleCalendarId.getEventsForDay(new Date(), { search: "오후 반차" });
  const afternoon2Half = googleCalendarId.getEventsForDay(new Date(), { search: "오후 반반차" });

  const reserveForces = googleCalendarId.getEventsForDay(new Date(), { search: "예비군" });
  const health = googleCalendarId.getEventsForDay(new Date(), { search: "건강 검진" });
  const petition = googleCalendarId.getEventsForDay(new Date(), { search: "청원 휴가" });
  const allDay = googleCalendarId.getEventsForDay(new Date(), { search: "휴가" });

  const summary = morning4Half.length + morning2Half.length + afternoon4Half.length + afternoon2Half.length + reserveForces.length + health.length + petition.length + allDay.length;
  let attachments = [];
  
  if (summary < 1) {
    // 휴가자가 없는 경우
    let text = `#### ✈️ 오늘의 휴가자는 없습니다. 🙂\n`;
    attachments = [
      {
        text: text,
        fields: [
          {
            short: true,
            title: ':sadmove: :sadmove: :sadmove: :sadmove: :sadmove: :sadmove: ',
            value: '휴가 가고 싶드아................ :sadmove: ',
          },
        ],
      },
    ];
  }else {
    // 휴가자가 있을 경우
    let text = `#### ✈️오늘의 휴가자는 ${summary}명입니다. 🏖️\n`;
    attachments = [
      {
        // color 는 Default 값을 사용
        text: text,
        fields: [
          {
            short: true,
            title: `오전반차 (${morning4Half.length})`,
            value: getText(morning4Half, "[오전 반차] ") || "",
          },
          {
            short: true,
            title: `오전반반차 (${morning2Half.length})`,
            value: getText(morning2Half, "[오전 반반차] ") || "",
          },
          {
            short: true,
            title: `오후반차 (${afternoon4Half.length})`,
            value: getText(afternoon4Half, "[오후 반차] ") || "",
          },
          {
            short: true,
            title: `오후반반차 (${afternoon2Half.length})`,
            value: getText(afternoon2Half, "[오후 반반차] ") || "",
          },
          {
            short: true,
            title: `예비군 (${reserveForces.length})`,
            value: getText(reserveForces, "[예비군] ") || "",
          },
          {
            short: true,
            title: `청원휴가 (${petition.length})`,
            value: getText(petition, "[청원휴가] ") || "",
          },
          {
            short: true,
            title: `건강검진 (${health.length})`,
            value: getText(health, "[건강검진] ") || "",
          },
          {
            short: true,
            title: `하루종일 (${allDay.length})`,
            value: getText(allDay, "[휴가] ") || "",
          },
        ],
      },
    ];
  }
  postMattermostWebhook("", `${GOOGLE_CALENDAR_VACATION_BOT_NAME}`, attachments);
}

const todayGoogleCalendarEvent = (googleCalendarId) => {
  const events = googleCalendarId.getEventsForDay(new Date());
  let text = "#### 안녕? 👋 좋은 아침이에요! ";
  let msg = "";

  // 이벤트가 없을 때
  if (events.length < 1) {
    text += "오늘은 특별한 일정이 없네요 🙂";
  } else {
    text += "오늘의 일정을 간략하게 알려드릴게요.";
    msg = "| 시간 | 제목 | 회의실 |\n|:------|:-------| :----------|\n";

    for (let i = 0; i < events.length; i++) {
      // 회의 시작 시간
      const startTime = Utilities.formatDate(
        events[i].getStartTime(),
        "GMT+0900",
        "HH시 mm분"
      );
      // 회의 종료 시간
      const endTime = Utilities.formatDate(
        events[i].getEndTime(),
        "GMT+0900",
        "HH시 mm분"
      );

      // 회의실
      const location = events[i].getLocation();
      // 이벤트 제목
      const title = events[i].getTitle().trim();

      // 휴가와 생일을 제외한 나머지 이벤트들만 가져옵니다.
      if (
        title.indexOf("휴가") === -1 &&
        title.indexOf("오전 반차") === -1 &&
        title.indexOf("오후 반차") === -1 &&
        title.indexOf("생일") === -1 && 
        title.indexOf("건강검진") === -1 &&
        title.indexOf("오전 반차") === -1 &&
        title.indexOf("오전 반반차") === -1 &&
        title.indexOf("오후 반차") === -1 &&
        title.indexOf("오후 반반차") === -1
      ) {
        msg += `|${startTime} ~ ${endTime}|${title}|${location}|\n`;
      }
    }
  }

  const attachments = [
    {
      color: "#cc101f",
      text: text,
      fields: [
        {
          short: true,
          // 이벤트가 있을 경우 오늘 날짜를 타이틀로 보여줍니다.
          title: events.length < 1 ? "" : getToday(),
          value: msg, // 이벤트 정보
        },
      ],
      // attachments 의 footer 정보
      footer: "전 좀 쉬어야겠어요. 그럼 이만!",
      footer_icon: "https://img.icons8.com/color/420/cocktail.png",
    },
  ];

  postMattermostWebhook("", `${GOOGLE_CALENDAR_BOT_NAME}`, attachments);
}

/**
 * 메타 모스트로 메세지를 전달 하는 역할을 합니다.
 */
const postMattermostWebhook = (msgBody, userName, attachments = []) => {
  const icon = userName === `${GOOGLE_CALENDAR_BOT_NAME}` ? "https://img.icons8.com/color/420/iron-man.png" : 'https://img.icons8.com/color/420/sunbathe.png';
  const payload = {
    text: msgBody,
    icon_url: icon,
    username: userName || "TODAY EVENTS",
    attachments: attachments,
  };

  const response = UrlFetchApp.fetch(WEBHOOK_ID, {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  });
  response.getContentText("UTF-8");
}

/**
 * 이벤트 제목에 말머리가 있을 경우 이를 파싱해 말머리를 제외한 제목을 리턴해주는 함수
 */
function getText(events, seperator) {
  let text = [];
  
  for (let i=0; i<events.length; i++) {
    const title = events[i].getTitle().split(seperator.trim())[1];
    if (title === undefined) continue;
    text.push(title);
  }
  
  return text.length > 1 ? text.join(", ") : text.join("");
}

/**
 * 현재 날짜를 가져온다.
 */
const getToday = () => {
  return Utilities.formatDate(new Date(), "GMT+0900", "YYYY년 MM월 dd일");
}

const getGoogleCalendarID = () => {
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const GOOGLE_CALENDARID = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
  const day = new Date();

  if (day.getDay() === week.indexOf('토') || day.getDay() === week.indexOf('일')) return;
  else return GOOGLE_CALENDARID;
}


/**
 * description
 *  - 메타모스트에서 `/today` 슬래시 명령어를 입력 했을때 구글 신기술사업부 캘린더를 가져옵니다.
 *  - 현재 휴가자와 회의 일정을 가져옵니다.
 */
const doPost = (e) => {
  // Mattermost에서 전송된 파라미터 가져오기
  const params = e.parameter || {};

  // 디버깅 정보 구성
  let debugInfo = "Debug Info:\n";
  debugInfo += "Full request: " + JSON.stringify(e) + "\n";
  debugInfo += "Parameters: " + JSON.stringify(params) + "\n";

  // 명령어와 토큰 추출
  const command = params.command || '';
  const token = params.token || '';
  const expectedToken = "";

  debugInfo += "Command: " + command + "\n";
  debugInfo += "Token: " + token + "\n";
  debugInfo += "Expected Token: " + expectedToken + "\n";

  // 토큰 검증
  if (token !== expectedToken) {
    debugInfo += "Token mismatch detected!\n";
    return ContentService.createTextOutput(
      JSON.stringify({ text: "Unauthorized: 잘못된 토큰입니다.\n" + debugInfo })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // /today 명령어 처리
  if (command === '/today') {
    todayEvent();
    return ContentService.createTextOutput(
      JSON.stringify({ text: "오늘의 일정 및 휴가자를 Slack에 게시했습니다!\n" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 기본 응답
  return ContentService.createTextOutput(
    JSON.stringify({ text: "잘못된 명령어입니다.\n" + debugInfo })
  ).setMimeType(ContentService.MimeType.JSON);
}

// 트리거 생성 및 관리
function createTrigger() {
  Logger.log("createTrigger 실행");
  const existingTriggers = ScriptApp.getProjectTriggers();
  let triggerExists = false;

  for (let i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === 'scheduleMeetingReminders') {
      triggerExists = true;
      Logger.log("scheduleMeetingReminders 트리거 이미 존재");
      break;
    }
  }

  if (!triggerExists) {
    ScriptApp.newTrigger('scheduleMeetingReminders')
      .timeBased()
      .everyMinutes(1)
      .create();
    Logger.log("scheduleMeetingReminders 트리거 생성 완료");
  }
}

// 30분 전 회의 알림 트리거 설정
function scheduleMeetingReminders() {
  Logger.log("scheduleMeetingReminders 시작, 현재 시간: " + new Date());

  const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
  const now = new Date();
  const timeFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const props = PropertiesService.getScriptProperties();

  const events = calendar.getEvents(now, timeFromNow);
  Logger.log("조회된 이벤트 수: " + events.length);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventStartTime = event.getStartTime();
    const timeBeforeEvent = new Date(eventStartTime.getTime() - 30 * 60 * 1000);
    const eventId = event.getId();

    // 30분 전과의 시간 차이 (분 단위)
    const timeDiff = (timeBeforeEvent.getTime() - now.getTime()) / (1000 * 60);
    Logger.log(`이벤트 ${i + 1}: 제목=${event.getTitle()}, 시작 시간=${eventStartTime}, 30분 전=${timeBeforeEvent}, 시간 차이=${timeDiff}분`);

    // 30분 이내 (0초 ~ 59초) 조건
    if (!event.isAllDayEvent() && timeDiff >= -1 && timeDiff <= 1) { // -1분 ~ +1분 범위
      const notified = props.getProperty(eventId);
      if (!notified) {
        notifyMeeting(event);
        props.setProperty(eventId, "true");
        Logger.log(`알림 설정: ${eventId} at ${timeBeforeEvent}`);
      } else {
        Logger.log(`이미 알림 보냄: ${eventId}`);
      }
    }
  }

  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'scheduleMeetingReminders') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('scheduleMeetingReminders 트리거 삭제 완료');
    }
  }
  Logger.log("scheduleMeetingReminders 종료");
}

function notifyMeeting() {
  const calendar = CalendarApp.getCalendarById(GOOGLE_CALENDAR_ID);
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 1000); // 1분 이내 이벤트

  const events = calendar.getEvents(now, soon);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const title = event.getTitle();
    const startTime = Utilities.formatDate(event.getStartTime(), "GMT+0900", "HH시 mm분");
    const endTime = Utilities.formatDate(event.getEndTime(), "GMT+0900", "HH시 mm분");
    const location = event.getLocation() || "장소 없음";
    const description = event.getDescription() || "내용 없음";

    // 휴가/반차 등 제외
    if (!title.includes("휴가") && !title.includes("반차") && !title.includes("생일") && !title.includes("건강검진")) {
      const message = `**회의 30분 전 알림**\n` +
                      `**제목**: ${title}\n` +
                      `**시간**: ${startTime} ~ ${endTime}\n` +
                      `**장소**: ${location}\n` +
                      `**설명**: ${description}\n` +
                      `**준비하세요!**`;
      sendToMattermost(message);
    }
  }

    // 실행 후 트리거 삭제
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'notifyMeeting') {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log('notifyMeeting 트리거 삭제 완료');
    }
  }
  Logger.log("notifyMeeting 종료");
}

