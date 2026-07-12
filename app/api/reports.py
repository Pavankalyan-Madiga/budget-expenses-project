from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
import pandas as pd
from app.db.database import get_db
from app.models.models import Expense, User
from app.core.config import get_current_user

router = APIRouter()

@router.get("/csv")
def export_expenses_csv(month: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    year, mon = map(int, month.split('-'))
    start_date = f"{month}-01"
    end_date = f"{year}-{mon+1:02d}-01" if mon < 12 else f"{year+1}-01-01"

    expenses = db.query(Expense).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).all()

    if not expenses:
        return {"error": "No expenses found for this month"}

    # Convert to Pandas DataFrame
    data = [{"Amount": e.amount, "Category": e.category, "Description": e.description, "Date": e.expense_date} for e in expenses]
    df = pd.DataFrame(data)

    # Stream CSV response
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=expenses_{month}.csv"
    return response