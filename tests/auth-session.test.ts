import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
let curTok = "", curRec: any = null;
const mockSet = vi.fn(), mockDel = vi.fn(), mockGet = vi.fn();
const mockSave = vi.fn((t: string, r: any) => { curTok = t; curRec = r; });
const mockClear = vi.fn(() => { curTok = ""; curRec = null; });
function getPayload(t: string): any {
  try { const p = t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); const pad = p.padEnd(Math.ceil(p.length/4)*4,"="); const j = typeof Buffer!="undefined"?Buffer.from(pad,"base64").toString("utf-8"):atob(pad); return JSON.parse(j)||{}; } catch { return {}; }
}
function isExpired(t: string){ const p=getPayload(t); if(!Object.keys(p).length) return true; if(!p.exp) return false; return !(p.exp>Date.now()/1e3); }
const mockAuthRefresh = vi.fn();
const mockCollection = vi.fn((name: string) => {
  if (name === "users") return { authRefresh: mockAuthRefresh };
  throw new Error("unexpected collection " + name);
});
const mockCtor = vi.fn(function(this:any, url:string){ this.url=url; this.authStore={ save:mockSave, get token(){return curTok}, get record(){return curRec}, get model(){return curRec}, get isValid(){ if(!curTok||!curRec) return false; return !isExpired(curTok); }, clear: mockClear }; this.collection = mockCollection; });
vi.mock("pocketbase",()=>({default:mockCtor}));
const cookiesMock=vi.fn(); vi.mock("next/headers",()=>({cookies:(...a:any[])=>cookiesMock(...a)}));
function b64url(s:string){ return Buffer.from(s).toString("base64url"); }
function mkJwt(exp?:number, extra:Record<string,any>={}){ const h=b64url(JSON.stringify({alg:"HS256",typ:"JWT"})); const obj=exp!==undefined?{exp,...extra}:{...extra}; return `${h}.${b64url(JSON.stringify(obj))}.sig`; }
describe("auth-session WU2a",()=>{
  beforeEach(()=>{ vi.clearAllMocks(); curTok="";curRec=null; mockGet.mockReset();mockSet.mockReset();mockDel.mockReset(); mockAuthRefresh.mockReset(); mockCollection.mockClear(); process.env.POCKETBASE_URL="http://127.0.0.1:8090"; cookiesMock.mockResolvedValue({get:mockGet.mockImplementation(()=>undefined),set:mockSet,delete:mockDel}); vi.unstubAllEnvs?.(); });
  describe("getAuthUser server-validated",()=>{
    it("valid pb_auth with server refresh returns refreshed record id not raw cookie id",async()=>{
      const exp=Math.floor(Date.now()/1e3)+3600;
      const rawTok=mkJwt(exp); const rawRec={id:"victim-tampered",email:"evil@x.com",name:"Evil"};
      const serverRec={id:"real-server-id",email:"real@b.com",name:"Real"};
      const serverTok=mkJwt(exp+100);
      mockAuthRefresh.mockImplementationOnce(async()=>{ curTok=serverTok; curRec=serverRec; return {token: serverTok, record: serverRec}; });
      cookiesMock.mockResolvedValue({get:(n:string)=>n==="pb_auth"?{value:JSON.stringify({token:rawTok,record:rawRec})}:undefined,set:mockSet,delete:mockDel});
      vi.resetModules(); const {getAuthUser}=await import("../lib/auth");
      const u=await getAuthUser();
      expect(mockCollection).toHaveBeenCalledWith("users");
      expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
      expect(u).toEqual({id:"real-server-id",email:"real@b.com",name:"Real"});
      expect(u?.id).not.toBe("victim-tampered");
    });
    it("forged future-exp/tampered victim id rejected when authRefresh 401 → null and clears store",async()=>{
      const exp=Math.floor(Date.now()/1e3)+3600;
      const tok=mkJwt(exp); const rec={id:"victim-id",email:"victim@x.com",name:"Victim"};
      mockAuthRefresh.mockRejectedValueOnce(Object.assign(new Error("Unauthorized"),{status:401}));
      cookiesMock.mockResolvedValue({get:(n:string)=>n==="pb_auth"?{value:JSON.stringify({token:tok,record:rec})}:undefined,set:mockSet,delete:mockDel});
      vi.resetModules(); const {getAuthUser}=await import("../lib/auth");
      const u=await getAuthUser();
      expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
      expect(mockClear).toHaveBeenCalled();
      expect(u).toBeNull();
    });
    it("unreachable PB authRefresh failure → null fail-closed",async()=>{
      const exp=Math.floor(Date.now()/1e3)+3600;
      const tok=mkJwt(exp); const rec={id:"u1",email:"a@b.com",name:"A"};
      mockAuthRefresh.mockRejectedValueOnce(new Error("Network unreachable"));
      cookiesMock.mockResolvedValue({get:(n:string)=>n==="pb_auth"?{value:JSON.stringify({token:tok,record:rec})}:undefined,set:mockSet,delete:mockDel});
      vi.resetModules(); const {getAuthUser}=await import("../lib/auth");
      await expect(getAuthUser()).resolves.toBeNull();
      expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
      expect(mockClear).toHaveBeenCalled();
    });
    it("authRefresh MUST be called before getAuthUser returns",async()=>{
      const exp=Math.floor(Date.now()/1e3)+3600;
      const tok=mkJwt(exp); const rec={id:"u123",email:"a@b.com",name:"Alice"};
      let calledBeforeReturn=false;
      mockAuthRefresh.mockImplementationOnce(async()=>{ calledBeforeReturn=true; curTok=tok; curRec=rec; return {token:tok,record:rec}; });
      cookiesMock.mockResolvedValue({get:(n:string)=>n==="pb_auth"?{value:JSON.stringify({token:tok,record:rec})}:undefined,set:mockSet,delete:mockDel});
      vi.resetModules(); const {getAuthUser}=await import("../lib/auth");
      const u=await getAuthUser();
      expect(calledBeforeReturn).toBe(true);
      expect(mockAuthRefresh).toHaveBeenCalledTimes(1);
      expect(u).toEqual({id:"u123",email:"a@b.com",name:"Alice"});
    });
    it("expired local token avoids network (authRefresh not called)",async()=>{
      const exp=Math.floor(Date.now()/1e3)-3600;
      const tok=mkJwt(exp); const rec={id:"u1",email:"e@e.com",name:"Bob"};
      cookiesMock.mockResolvedValue({get:(n:string)=>n==="pb_auth"?{value:JSON.stringify({token:tok,record:rec})}:undefined,set:mockSet,delete:mockDel});
      vi.resetModules(); const {getAuthUser}=await import("../lib/auth");
      await expect(getAuthUser()).resolves.toBeNull();
      expect(mockAuthRefresh).not.toHaveBeenCalled();
      expect(mockCollection).not.toHaveBeenCalled();
    });
    it("no cache: second call invokes authRefresh again",async()=>{
      const exp=Math.floor(Date.now()/1e3)+3600;
      const tok=mkJwt(exp); const rec={id:"u1",email:"a@b.com",name:"A"};
      mockAuthRefresh.mockImplementation(async()=>{ curTok=tok; curRec=rec; return {token:tok,record:rec}; });
      cookiesMock.mockResolvedValue({get:(n:string)=>n==="pb_auth"?{value:JSON.stringify({token:tok,record:rec})}:undefined,set:mockSet,delete:mockDel});
      vi.resetModules(); const {getAuthUser}=await import("../lib/auth");
      await getAuthUser(); await getAuthUser();
      expect(mockAuthRefresh).toHaveBeenCalledTimes(2);
    });
    it("missing pb_auth → null",async()=>{ cookiesMock.mockResolvedValue({get:()=>undefined,set:mockSet,delete:mockDel}); vi.resetModules(); const {getAuthUser}=await import("../lib/auth"); await expect(getAuthUser()).resolves.toBeNull(); expect(mockAuthRefresh).not.toHaveBeenCalled(); });
    it("malformed pb_auth → null no throw",async()=>{ cookiesMock.mockResolvedValue({get:()=>({value:"not-json{{{"}),set:mockSet,delete:mockDel}); vi.resetModules(); const {getAuthUser}=await import("../lib/auth"); await expect(getAuthUser()).resolves.toBeNull(); expect(mockAuthRefresh).not.toHaveBeenCalled(); });
    it("session-only → null",async()=>{ cookiesMock.mockResolvedValue({get:(n:string)=>n==="session"?{value:"legacy"}:undefined,set:mockSet,delete:mockDel}); vi.resetModules(); const {getAuthUser}=await import("../lib/auth"); await expect(getAuthUser()).resolves.toBeNull(); expect(mockAuthRefresh).not.toHaveBeenCalled(); });
    it("uses createPocketBaseClient and authRefresh, not Appwrite",async()=>{ const src=fs.readFileSync(path.join(process.cwd(),"lib/auth.ts"),"utf8"); expect(src).toContain("createPocketBaseClient"); expect(src).toContain("authRefresh"); expect(src).toContain('collection("users")'); expect(src).not.toContain("createSessionClient"); expect(src).not.toContain("node-appwrite"); expect(src).not.toContain("account.get"); const src2=fs.readFileSync(path.join(process.cwd(),"lib/pocketbase.ts"),"utf8"); expect(src2).not.toContain("node-appwrite"); });
    it("no logging of token/pb_auth in lib/auth",async()=>{ const src=fs.readFileSync(path.join(process.cwd(),"lib/auth.ts"),"utf8"); expect(src).not.toMatch(/console\./); });
  });
  describe("cookie helpers",()=>{
    it("saveAuthCookie await cookies pb_auth JSON httpOnly lax path",async()=>{ const exp=Math.floor(Date.now()/1e3)+7200; const tok=mkJwt(exp); const rec={id:"u9",email:"x@y.com",name:"X"}; cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); const m=await import("../lib/pocketbase"); expect(typeof m.saveAuthCookie).toBe("function"); await m.saveAuthCookie(tok,rec); expect(cookiesMock).toHaveBeenCalled(); const src=fs.readFileSync(path.join(process.cwd(),"lib/pocketbase.ts"),"utf8"); expect(src).toContain("await cookies()"); expect(src).toContain("pb_auth"); expect(mockSet).toHaveBeenCalledTimes(1); const [n,v,o]=mockSet.mock.calls[0]; expect(n).toBe("pb_auth"); expect(JSON.parse(v)).toEqual({token:tok,record:rec}); expect(o.httpOnly).toBe(true); expect(o.sameSite).toBe("lax"); expect(o.path).toBe("/"); });
    it("saveAuthCookie secure iff production",async()=>{ const tok=mkJwt(undefined,{sub:"123"}); const rec={id:"u1",email:"a@a.com",name:"A"}; const orig=process.env.NODE_ENV; (process.env as any).NODE_ENV="development"; cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); let m=await import("../lib/pocketbase"); await m.saveAuthCookie(tok,rec); expect(mockSet.mock.calls[0][2].secure).toBe(false); vi.clearAllMocks(); (process.env as any).NODE_ENV="production"; cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); m=await import("../lib/pocketbase"); await m.saveAuthCookie(tok,rec); expect(mockSet.mock.calls[0][2].secure).toBe(true); (process.env as any).NODE_ENV=orig; });
    it("saveAuthCookie expires parseable JWT else omit",async()=>{ const exp=Math.floor(Date.now()/1e3)+3600; const tok=mkJwt(exp); const rec={id:"u1",email:"a@a.com",name:"A"}; cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); let m=await import("../lib/pocketbase"); await m.saveAuthCookie(tok,rec); expect(m).toBeDefined(); expect(mockSet.mock.calls[0][2].expires).toBeInstanceOf(Date); expect(Math.floor(mockSet.mock.calls[0][2].expires.getTime()/1e3)).toBe(exp); vi.clearAllMocks(); const tokNo=mkJwt(undefined,{foo:"bar"}); cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); m=await import("../lib/pocketbase"); await m.saveAuthCookie(tokNo,rec); expect(mockSet.mock.calls[0][2].expires).toBeUndefined(); vi.clearAllMocks(); cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); m=await import("../lib/pocketbase"); await m.saveAuthCookie("not.jwt.token",rec); expect(mockSet.mock.calls[0][2].expires).toBeUndefined(); });
    it("clearAuthCookie deletes pb_auth",async()=>{ cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); const m=await import("../lib/pocketbase"); expect(typeof m.clearAuthCookie).toBe("function"); await m.clearAuthCookie(); expect(cookiesMock).toHaveBeenCalled(); const del=mockDel.mock.calls.length>0; const set=mockSet.mock.calls.some((c:any[])=>c[0]==="pb_auth"&&(c[2]?.maxAge===0||c[2]?.expires)); expect(del||set).toBe(true); });
    it("clearLegacySessionCookie deletes session",async()=>{ cookiesMock.mockResolvedValue({get:mockGet,set:mockSet,delete:mockDel}); vi.resetModules(); const m=await import("../lib/pocketbase"); expect(typeof m.clearLegacySessionCookie).toBe("function"); await m.clearLegacySessionCookie(); expect(cookiesMock).toHaveBeenCalled(); const del=mockDel.mock.calls.some((c:any[])=>c[0]==="session"); const set=mockSet.mock.calls.some((c:any[])=>c[0]==="session"&&(c[2]?.maxAge===0||c[1]==="")); expect(del||set).toBe(true); });
    it("no cookie values logged",async()=>{ const src=fs.readFileSync(path.join(process.cwd(),"lib/pocketbase.ts"),"utf8"); expect(src).not.toMatch(/console\.log.*pb_auth/); expect(src).not.toMatch(/console\.log.*token/); const aSrc=fs.readFileSync(path.join(process.cwd(),"lib/auth.ts"),"utf8"); expect(aSrc).not.toMatch(/console\.log.*pb_auth/); });
    it("shared constants httpOnly lax path secure exp",async()=>{ const src=fs.readFileSync(path.join(process.cwd(),"lib/pocketbase.ts"),"utf8"); expect(src).toContain("pb_auth"); expect(src).toContain("session"); expect(src).toContain("httpOnly"); expect(src).toContain("sameSite"); expect(src).toContain("\"lax\""); expect(src).toContain("path"); expect(src).toContain("\"/\""); expect(src).toContain("NODE_ENV"); expect(src).toContain("production"); expect((src.match(/await cookies\(\)/g)||[]).length).toBeGreaterThanOrEqual(3); });
  });
});
