from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.schemas.schemas import BudgetCreate, BudgetOut
from app.models.models import Budget, Expense, User
from app.core.config import get_current_user
from fastapi import HTTPException

router = APIRouter()

@router.post("/", response_model=BudgetOut, status_code=201)
def create_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    existing = db.query(Budget).filter(Budget.month == budget.month, Budget.category == budget.category).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this month/category")

    db_budget = Budget(**budget.dict(), user_id=1)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/", response_model=list[BudgetOut])
def get_budgets(month: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)): # ADDED user auth back here!
    budgets = db.query(Budget).filter(Budget.user_id == user.id, Budget.month == month).all()
    
    results = []
    for b in budgets:
        year, mon = map(int, b.month.split('-'))
        start_date = f"{b.month}-01"
        end_date = f"{year}-{mon+1:02d}-01" if mon < 12 else f"{year+1}-01-01"
        used = db.query(func.sum(Expense.amount)).filter(
            Expense.category == b.category,
            Expense.expense_date >= start_date,
            Expense.expense_date < end_date
        ).scalar() or 0.0
        results.append(BudgetOut(
            id=b.id, month=b.month, category=b.category, budget_amount=b.budget_amount,
            used_amount=used, remaining_amount=b.budget_amount - used,
            percentage_consumed=round((used / b.budget_amount) * 100, 2) if b.budget_amount > 0 else 0
        ))
    return results

@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return