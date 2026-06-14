import json
import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from litellm import completion

from prelegal.config import get_settings

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

_SYSTEM_PROMPT_TEMPLATE = """You are a legal assistant helping a user draft a Mutual Non-Disclosure Agreement (MNDA). \
Have a friendly, conversational chat to gather all the information needed to complete the agreement.

Today's date is {today}.

Required information to collect:
- purpose: How the parties intend to use confidential information (e.g., "Evaluating a potential business partnership")
- effectiveDate: When the MNDA takes effect, in YYYY-MM-DD format
- mndaTermType: How long the MNDA lasts — "years" (fixed duration) or "until-terminated" (continues until written notice)
- mndaTermYears: If mndaTermType is "years", number of years as a string (e.g., "1")
- confidentialityTermType: How long confidential information must be kept secret — "years" or "in-perpetuity"
- confidentialityTermYears: If confidentialityTermType is "years", number of years as a string
- governingLaw: US state whose laws govern the agreement (e.g., "Delaware")
- jurisdiction: City/county and state for dispute resolution (e.g., "New Castle, DE")
- modifications: Any changes to the standard MNDA terms, or "None" if no modifications
- party1Name: Full legal name of Party 1's authorized signatory
- party1Title: Job title of Party 1's signatory
- party1Company: Legal entity name of Party 1
- party1Address: Email or postal address for legal notices to Party 1
- party2Name: Full legal name of Party 2's authorized signatory
- party2Title: Job title of Party 2's signatory
- party2Company: Legal entity name of Party 2
- party2Address: Email or postal address for legal notices to Party 2

Conversation guidelines:
1. Ask 1-2 questions at a time — don't overwhelm the user.
2. Start with the purpose of the NDA and both parties' company names.
3. Be helpful — if the user is unsure (e.g., about governing law), offer a suggestion like "Many companies use Delaware — would that work?".
4. Convert informal dates (e.g., "today", "tomorrow") to YYYY-MM-DD based on today being {today}.
5. Set modifications to "None" if the user says there are no changes to the standard terms.
6. Explain MNDA term and confidentiality term options simply when asking.
7. Once all fields are gathered, congratulate the user and tell them the NDA is complete and ready to download.

In your structured response:
- Set "message" to your conversational reply.
- Set "fields" with ALL fields you have gathered so far. Omit or set to null any fields you don't know yet.
- Only include mndaTermYears if mndaTermType is "years"; only include confidentialityTermYears if confidentialityTermType is "years"."""


def _build_system_prompt() -> str:
    today = datetime.date.today().isoformat()
    return _SYSTEM_PROMPT_TEMPLATE.format(today=today)


class NDAFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[str] = None
    mndaTermYears: Optional[str] = None
    confidentialityTermType: Optional[str] = None
    confidentialityTermYears: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Company: Optional[str] = None
    party1Address: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Company: Optional[str] = None
    party2Address: Optional[str] = None


class ChatResponseData(BaseModel):
    message: str
    fields: NDAFields


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponseData)
async def chat(request: ChatRequest) -> ChatResponseData:
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    messages = [{"role": "system", "content": _build_system_prompt()}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=ChatResponseData,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=settings.openrouter_api_key,
        )
        raw = response.choices[0].message.content
        return ChatResponseData.model_validate_json(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")
