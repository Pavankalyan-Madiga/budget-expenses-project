from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.db.database import get_db
from app.schemas.schemas import BudgetCreate, BudgetOut, normalize_month
from app.models.models import Budget, Expense, User
from app.core.config import get_current_user

router = APIRouter()

@router.post("/", response_model=BudgetOut, status_code=201)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.month == budget.month,
        Budget.category == budget.category,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists for this month/category")

    db_budget = Budget(**budget.model_dump(), user_id=user.id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/", response_model=list[BudgetOut])
def get_budgets(month: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        month = normalize_month(month)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    budgets = db.query(Budget).filter(Budget.user_id == user.id, Budget.month == month).all()

    results = []
    for b in budgets:
        year, mon = map(int, b.month.split('-'))
        start_date = date(year, mon, 1)
        end_date = date(year, mon + 1, 1) if mon < 12 else date(year + 1, 1, 1)
        used = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user.id,
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

@router.get("/categories", response_model=list[str])
def get_all_budget_categories(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    All distinct categories the user has ever set a budget for, across every
    month — not just the current one. The Add Expense form uses this so a
    category shows up there as soon as you create a budget for it, regardless
    of which month you picked.
    """
    rows = (
        db.query(Budget.category)
        .filter(Budget.user_id == user.id)
        .distinct()
        .order_by(Budget.category.asc())
        .all()
    )
    return [r[0] for r in rows]

@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user.id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return