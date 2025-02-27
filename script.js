const GOOGLE_CALENDAR_BOT_NAME = '오늘의 일정 봇';
const GOOGLE_CALENDAR_VACATION_BOT_NAME = '휴가자 알림이 봇';
const GOOGLE_CALENDAR_ID = "{캘린더 ID}@group.calendar.google.com";
const MATTER_MOST_WEBHOOK_ID = "{메타모스트 웹훅 ID}";

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
        let text = `#### :flight_departure: 오늘의 휴가자는 없습니다. :slightly_smiling_face:\n`;
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
        let text = `#### :flight_departure: 오늘의 휴가자는 ${summary}명입니다. :beach_umbrella:\n`;
        attachments = [
        {
            // color 는 Default 값을 사용
            text: text,
            fields: [
            {
                short: true,
                title: `오전반차 (${morning4Half.length})`,
                value: getText(morning4Half, "[오전반차] ") || "",
            },
            {
                short: true,
                title: `오전반반차 (${morning2Half.length})`,
                value: getText(morning2Half, "[오전반반차] ") || "",
            },
            {
                short: true,
                title: `오후반차 (${afternoon4Half.length})`,
                value: getText(afternoon4Half, "[오후반차] ") || "",
            },
            {
                short: true,
                title: `오후반반차 (${afternoon2Half.length})`,
                value: getText(afternoon2Half, "[오후반반차] ") || "",
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
    let text = "#### 안녕? :wave: 좋은 아침이에요! ";
    let msg = "";

    // 이벤트가 없을 때
    if (events.length < 1) {
    text += "오늘은 특별한 일정이 없네요 :slightly_smiling_face:";
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
        title.indexOf("오전반차") === -1 &&
        title.indexOf("오후반차") === -1 &&
        title.indexOf("생일") === -1 && 
        title.indexOf("건강검진") === -1 &&
        title.indexOf("오전반차") === -1 &&
        title.indexOf("오전반반차") === -1 &&
        title.indexOf("오후반차") === -1 &&
        title.indexOf("오후반반차") === -1
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

    const response = UrlFetchApp.fetch(MATTER_MOST_WEBHOOK_ID, {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
    });
    response.getContentText("UTF-8");
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
  const expectedToken = "{Mattermost 슬래시 명령어 토큰 값}";

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
      JSON.stringify({ text: "오늘의 일정 및 휴가자를 Mattermost에 게시했습니다!\n" })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // 기본 응답
  return ContentService.createTextOutput(
    JSON.stringify({ text: "잘못된 명령어입니다.\n" + debugInfo })
  ).setMimeType(ContentService.MimeType.JSON);
}
