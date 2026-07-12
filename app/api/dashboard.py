from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.db.database import get_db
from app.schemas.schemas import MonthlySummary
from app.models.models import Expense, Budget, User
from app.core.config import get_current_user

router = APIRouter()

@router.get("/monthly-summary", response_model=MonthlySummary)
def get_summary(month: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    year, mon = map(int, month.split('-'))
    start_date = date(year, mon, 1)
    end_date = date(year, mon + 1, 1) if mon < 12 else date(year + 1, 1, 1)

    total_expenses = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user.id,
        Expense.expense_date >= start_date,
        Expense.expense_date < end_date
    ).scalar() or 0.0

    total_budget = db.query(func.sum(Budget.budget_amount)).filter(
        Budget.user_id == user.id,
        Budget.month == month
    ).scalar() or 0.0

    return MonthlySummary(
        month=month,
        total_expenses=total_expenses,
        total_budget=total_budget
    )