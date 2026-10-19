/* 로그인 기능에서 같이 쓰는 값
   서버·브라우저·proxy 어디서 불러와도 안전한 값만 둡니다. (비밀 값 X) */

/** 세션 쿠키 이름 */
export const SESSION_COOKIE = 'session'

/** 로그인 유지 기간 (초): 7일 */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

/* ---------- 본인인증 인증번호 ---------- */
/** 인증번호 자릿수 */
export const CODE_LENGTH = 6
/** 인증번호 유효 시간 (초): 5분 */
export const CODE_TTL_SEC = 5 * 60
/** 다시 받기까지 기다리는 시간 (초) */
export const CODE_RESEND_SEC = 60
/** 틀릴 수 있는 횟수: 넘으면 인증번호를 새로 받아야 함 */
export const CODE_MAX_ATTEMPTS = 5

/* ---------- 이동 경로 ---------- */
/** 로그인 후 기본으로 가는 곳 */
export const AFTER_LOGIN_PATH = '/library'
/** 본인인증을 마친 뒤 기본으로 가는 곳 (새로 가입한 사람은 자료가 없으니 요약부터) */
export const AFTER_VERIFY_PATH = '/ai'
