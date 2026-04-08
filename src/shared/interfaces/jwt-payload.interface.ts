export interface JwtPayload {
  sub: string;
  role: string;
  sid: string; // sessionId
  iat?: number;
  exp?: number;
  name: string;
  deviceId: string;
  profileId: string;
  mobile: string;
  email: string;
  userType: string;
}
