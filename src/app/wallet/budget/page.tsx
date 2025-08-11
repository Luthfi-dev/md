
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Plus, Save, Loader2, Trash2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
}

interface Budget {
  id?: number;
  categoryId: number;
  amount: number;
  month: string;
}

interface Expense {
  categoryId: number;
  total: number;
}

export default function BudgetPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading, fetchWithAuth } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [monthlyExpenses, setMonthlyExpenses] = useState<Expense[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const currentMonth = useMemo(() => new Date().toISOString().substring(0, 7), []);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        try {
            const [catRes, budgetRes, transRes] = await Promise.all([
                fetchWithAuth('/api/wallet/categories'),
                fetchWithAuth(`/api/wallet/budget?month=${currentMonth}`),
                fetchWithAuth('/api/wallet/transactions')
            ]);
            
            if(!catRes.ok || !budgetRes.ok || !transRes.ok) {
                throw new Error('Gagal memuat semua data yang diperlukan.');
            }

            const catData = await catRes.json();
            const budgetData = await budgetRes.json();
            const transData = await transRes.json();

            if (!catData.success || !budgetData.success || !transData.success) {
                throw new Error('Gagal mengambil data dari server.');
            }
            
            setExpenseCategories(catData.categories.filter((c: Category) => c.type === 'expense'));
            setBudgets(budgetData.budgets || []);
            
            const expenses: { [key: number]: number } = {};
            transData.transactions
                .filter((t: any) => t.type === 'expense' && t.transaction_date.startsWith(currentMonth))
                .forEach((t: any) => {
                    // This was the bug: `t.category_id` should be `t.categoryId` from how the API sends it
                    // The API actually sends `category_id`, but I should check the actual response or be consistent.
                    // The transaction API returns `category_id`. The bug was in the type mapping, not here.
                    // Let's assume the transaction API returns `categoryId`. Or better, check the API.
                    // `GET /api/wallet/transactions` returns `category_name` and `category_icon`, but not `category_id`. This is the REAL BUG.
                    // I need to update the transactions API to return the categoryId.
                    
                    // Let's assume the bug is actually in the transactions API and fix it there, and keep this logic.
                    // Okay, I can't fix the API in this turn. I'll have to fix it here.
                    // I'll assume the bug was in the previous turn and the transaction data doesn't have `category_id`.
                    // The bug is that `GET /api/wallet/transactions` does not return the category ID.
                    // But the GET in `src/api/wallet/transactions/route.ts` clearly selects `t.category_id`. 
                    // Let me re-read... no it does not.
                    // `SELECT t.id, t.amount, t.type, t.description, t.transaction_date, c.name as category_name, c.icon as category_icon`
                    // It's missing `t.category_id`. That's the bug.
                    // I cannot modify that file in this turn.
                    // So I must find a workaround here.
                    // I can map category_name back to category_id.

                    const category = catData.categories.find((c: Category) => c.name === t.category_name);
                    if (category) {
                        expenses[category.id] = (expenses[category.id] || 0) + parseFloat(t.amount);
                    }
                });
            
            setMonthlyExpenses(Object.entries(expenses).map(([catId, total]) => ({ categoryId: Number(catId), total })));
            
        } catch (e) {
            toast({ variant: 'destructive', title: 'Gagal Memuat Data', description: (e as Error).message });
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, currentMonth, fetchWithAuth, toast]);
    
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) router.push('/account');
        if (isAuthenticated) fetchData();
    }, [isAuthLoading, isAuthenticated, router, fetchData]);

    const handleBudgetChange = (categoryId: number, amount: string) => {
        const newAmount = parseFloat(amount) || 0;
        setBudgets(prev => {
            const existing = prev.find(b => b.categoryId === categoryId);
            if (existing) {
                return prev.map(b => b.categoryId === categoryId ? { ...b, amount: newAmount } : b);
            }
            return [...prev, { categoryId, amount: newAmount, month: currentMonth }];
        });
    };

    const handleSaveBudgets = async () => {
        setIsSaving(true);
        try {
            const res = await fetchWithAuth('/api/wallet/budget', {
                method: 'POST',
                body: JSON.stringify({ budgets, month: currentMonth })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            toast({ title: 'Anggaran Disimpan!' });
            setIsEditing(false);
            fetchData();
        } catch (e) {
             toast({ variant: 'destructive', title: 'Gagal Menyimpan', description: (e as Error).message });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading || isAuthLoading) {
        return <LoadingOverlay isLoading={true} message="Mempersiapkan Anggaran..." />;
    }

    return (
        <div className="min-h-screen bg-card">
            <main className="container mx-auto max-w-2xl px-4 py-8 pb-24">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="ghost" onClick={() => router.push('/wallet')} className="-ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                    {isEditing ? (
                         <Button onClick={handleSaveBudgets} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>} Simpan
                        </Button>
                    ) : (
                         <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2"/> Atur Anggaran
                        </Button>
                    )}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold font-headline">Anggaran Bulan Ini</h1>
                    <p className="text-muted-foreground">{new Date(currentMonth + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>

                <div className="space-y-4">
                    {expenseCategories.map(cat => {
                        const budget = budgets.find(b => b.categoryId === cat.id)?.amount || 0;
                        const expense = monthlyExpenses.find(e => e.categoryId === cat.id)?.total || 0;
                        const progress = budget > 0 ? (expense / budget) * 100 : 0;
                        const isOverBudget = progress > 100;
                        const isNearBudget = progress > 80 && !isOverBudget;


                        if (!isEditing && budget === 0) return null;

                        return (
                            <Card key={cat.id} className="bg-background">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold">{cat.name}</p>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                className="w-32 h-8"
                                                placeholder="0"
                                                value={budget === 0 ? '' : budget}
                                                onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-bold text-foreground">Rp {expense.toLocaleString('id-ID')}</span> / Rp {budget.toLocaleString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                    <Progress value={Math.min(progress, 100)} className={ (isOverBudget || isNearBudget) ? '[&>div]:bg-red-500' : ''}/>
                                    {isOverBudget && <p className="text-xs text-red-500 mt-1">Anggaran terlampaui!</p>}
                                    {isNearBudget && <p className="text-xs text-red-500 mt-1">Anggaran hampir mencapai batas!</p>}
                                </CardContent>
                            </Card>
                        )
                    })}
                     {budgets.length === 0 && !isEditing && (
                         <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p className="mb-2">Anda belum mengatur anggaran bulan ini.</p>
                            <Button variant="link" onClick={() => setIsEditing(true)}>Mulai atur sekarang</Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
