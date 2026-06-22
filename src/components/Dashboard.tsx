import React, { useMemo, useState } from 'react';
import {
  Users, UserPlus, TrendingUp, Building2, Target,
  PhoneCall, FileText, DollarSign, ArrowUpRight,
  ArrowDownRight, Loader2, Calendar, Clock, Activity,
  PieChart as PieChartIcon, BarChart3, Eye, EyeOff,
  TrendingDown, ChevronRight, Sparkles, Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCRMDashboard } from '../hooks/useCRMDashboard';
import type { CRMDashboardMetrics } from '../hooks/useCRMDashboard';
import type { LeadStatus } from '../modules/crm/types';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
} from '../modules/crm/types';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, ComposedChart, Line,
} from 'recharts';

// ============================================
// PALETA DE CORES EGEN
// ============================================
const EGEN = {
  navy: '#0D2A59',
  yellow: '#F3B229',
  blue: '#6A93C7',
  green: '#7AC15F',
  red: '#E5484D',
  dark: '#1a1a2e',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
};

const CHART_COLORS = [EGEN.navy, EGEN.yellow, EGEN.blue, EGEN.green, EGEN.red, '#8B5CF6', '#EC4899', '#F97316'];
const GRADIENT_BG = 'bg-gradient-to-br from-egen-navy via-[#0D2A59] to-[#162d4a] dark:from-[#0a1628] dark:via-[#0d1f33] dark:to-[#0a1628]';

// ============================================
// SKELETON
// ============================================
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 animate-pulse backdrop-blur-sm">
    <div className="flex items-center justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-3.5 bg-gray-200 dark:bg-white/[0.06] rounded-full w-20" />
        <div className="h-7 bg-gray-200 dark:bg-white/[0.06] rounded-full w-14" />
        <div className="h-3 bg-gray-100 dark:bg-white/[0.04] rounded-full w-24" />
      </div>
      <div className="w-11 h-11 bg-gray-200 dark:bg-white/[0.06] rounded-xl" />
    </div>
  </div>
);

const SkeletonChart: React.FC<{ h?: string }> = ({ h = 'h-64' }) => (
  <div className={`bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-6 ${h} animate-pulse backdrop-blur-sm`}>
    <div className="h-4 bg-gray-200 dark:bg-white/[0.06] rounded-full w-36 mb-6" />
    <div className="h-full bg-gray-100 dark:bg-white/[0.04] rounded-xl" />
  </div>
);

// ============================================
// HELPERS
// ============================================
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

// ============================================
// STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean } | null;
  color: string;
  bgColor: string;
  onClick?: () => void;
  sublabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, color, bgColor, onClick, sublabel }) => (
  <div
    onClick={onClick}
    className={`group relative bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:-translate-y-0.5 backdrop-blur-sm ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1.5 min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.positive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className={`text-xs font-semibold ${trend.positive ? 'text-emerald-500' : 'text-red-500'}`}>
              {formatPercent(trend.value)}
            </span>
            <span className="text-xs text-gray-400 ml-0.5">este mês</span>
          </div>
        )}
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${bgColor} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </div>
);

// ============================================
// CHART CARD WRAPPER
// ============================================
const ChartCard: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode; className?: string }> = ({
  title, icon: Icon, children, className = '',
}) => (
  <div className={`bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 sm:p-6 backdrop-blur-sm ${className}`}>
    <div className="flex items-center gap-2.5 mb-4">
      <div className="p-1.5 rounded-lg bg-egen-navy/5 dark:bg-egen-yellow/10">
        <Icon className="w-4 h-4 text-egen-navy dark:text-egen-yellow" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
    </div>
    {children}
  </div>
);

// ============================================
// MAIN DASHBOARD
// ============================================
const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { metrics, loading, error } = useCRMDashboard();
  const [showCharts, setShowCharts] = useState(true);

  const userName = userProfile?.name?.split(' ')[0] || 'Usuário';

  if (loading) return <DashboardSkeleton />;
  if (error && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <Activity className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg font-medium">Erro ao carregar dados</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  const chartData = buildChartData(metrics);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <div className={`${GRADIENT_BG} rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-egen-yellow/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-400/5 rounded-full translate-y-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-egen-yellow" />
              <span className="text-xs font-medium text-egen-yellow uppercase tracking-widest">Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-sm text-white/60 mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
              <p className="text-2xl font-bold text-egen-yellow">{metrics.totalClients}</p>
              <p className="text-xs text-white/60">Clientes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
              <p className="text-2xl font-bold text-blue-300">{metrics.totalLeads}</p>
              <p className="text-xs text-white/60">Leads</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
              <p className="text-2xl font-bold text-emerald-300">{metrics.totalProposals}</p>
              <p className="text-xs text-white/60">Propostas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* KEY METRICS CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total de Clientes"
          value={metrics.totalClients}
          icon={Users}
          trend={{ value: metrics.newClientsThisMonth, positive: true }}
          color="text-egen-navy"
          bgColor="bg-egen-navy/10"
          sublabel={`${metrics.activeClients} ativos`}
        />
        <StatCard
          label="Leads Ativos"
          value={metrics.totalLeads}
          icon={UserPlus}
          trend={{ value: metrics.newLeadsThisMonth, positive: metrics.newLeadsThisMonth > 0 }}
          color="text-blue-600"
          bgColor="bg-blue-50 dark:bg-blue-500/10"
          sublabel={`${metrics.convertedLeads} convertidos`}
        />
        <StatCard
          label="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={Target}
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-500/10"
          sublabel={`${metrics.convertedLeads}/${metrics.totalLeads} leads`}
        />
        <StatCard
          label="Valor em Propostas"
          value={formatCurrency(metrics.proposalsTotalValue)}
          icon={DollarSign}
          color="text-amber-600"
          bgColor="bg-amber-50 dark:bg-amber-500/10"
          sublabel={`${metrics.totalProposals} propostas`}
        />
      </div>

      {/* ============================================ */}
      {/* ACTION CARDS ROW */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ActionCard
          icon={PhoneCall}
          label="A Contatar"
          value={metrics.leadsRequiringContact}
          color="bg-blue-500"
          pulse
        />
        <ActionCard
          icon={Calendar}
          label="Follow-up"
          value={metrics.leadsRequiringFollowUp}
          color="bg-amber-500"
        />
        <ActionCard
          icon={FileText}
          label="Propostas Ativas"
          value={metrics.proposalsByStatus['draft'] || 0 + metrics.proposalsByStatus['sent'] || 0}
          color="bg-egen-navy"
        />
        <ActionCard
          icon={Building2}
          label="Novos este Mês"
          value={metrics.newClientsThisMonth + metrics.newLeadsThisMonth}
          color="bg-emerald-500"
        />
      </div>

      {/* ============================================ */}
      {/* CHARTS TOGGLE */}
      {/* ============================================ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-egen-navy/5 dark:bg-egen-yellow/10">
            <BarChart3 className="w-4 h-4 text-egen-navy dark:text-egen-yellow" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Análises e Gráficos</h2>
        </div>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
            showCharts
              ? 'bg-egen-navy/5 dark:bg-egen-yellow/10 text-egen-navy dark:text-egen-yellow'
              : 'bg-gray-100 dark:bg-white/5 text-gray-500'
          }`}
        >
          {showCharts ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showCharts ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {showCharts && (
        <>
          {/* ============================================ */}
          {/* CHARTS ROW 1 - Client Status + Lead Status */}
          {/* ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <ChartCard title="Clientes por Status" icon={PieChartIcon}>
              <div className="h-64 sm:h-72">
                {chartData.clientStatusPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.clientStatusPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        cornerRadius={4}
                      >
                        {chartData.clientStatusPie.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          borderRadius: '14px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number, name: string) => [`${value} clientes`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={PieChartIcon} text="Sem dados de clientes" />
                )}
              </div>
            </ChartCard>

            <ChartCard title="Pipeline de Leads" icon={BarChart3}>
              <div className="h-64 sm:h-72">
                {chartData.leadPipelineBar.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.leadPipelineBar} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          borderRadius: '14px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number) => [`${value} leads`, 'Quantidade']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {chartData.leadPipelineBar.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={BarChart3} text="Sem dados de leads" />
                )}
              </div>
            </ChartCard>
          </div>

          {/* ============================================ */}
          {/* CHARTS ROW 2 - Monthly Trends */}
          {/* ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <ChartCard title="Crescimento de Clientes (6 meses)" icon={TrendingUp}>
              <div className="h-56 sm:h-64">
                {chartData.clientTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.clientTrend}>
                      <defs>
                        <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={EGEN.navy} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={EGEN.navy} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          borderRadius: '14px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number) => [`${value}`, 'Clientes']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={EGEN.navy}
                        strokeWidth={2.5}
                        fill="url(#clientGrad)"
                        dot={{ r: 4, fill: EGEN.navy, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: EGEN.navy, strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={TrendingUp} text="Sem dados de tendência" />
                )}
              </div>
            </ChartCard>

            <ChartCard title="Novos Leads (6 meses)" icon={Zap}>
              <div className="h-56 sm:h-64">
                {chartData.leadTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.leadTrend}>
                      <defs>
                        <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={EGEN.yellow} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={EGEN.yellow} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          borderRadius: '14px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number) => [`${value}`, 'Leads']}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={EGEN.yellow}
                        strokeWidth={2.5}
                        fill="url(#leadGrad)"
                        dot={{ r: 4, fill: EGEN.yellow, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: EGEN.yellow, strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={Zap} text="Sem dados de tendência" />
                )}
              </div>
            </ChartCard>
          </div>

          {/* ============================================ */}
          {/* CHARTS ROW 3 - Proposal Status + Value */}
          {/* ============================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <ChartCard title="Propostas por Status" icon={FileText}>
              <div className="h-64 sm:h-72">
                {chartData.proposalStatusPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.proposalStatusPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        cornerRadius={4}
                      >
                        {chartData.proposalStatusPie.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          borderRadius: '14px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          fontSize: '13px',
                        }}
                        formatter={(value: number, name: string) => [`${value} propostas`, name]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart icon={FileText} text="Sem propostas cadastradas" />
                )}
              </div>
            </ChartCard>

            <ChartCard title="Resumo de Clientes" icon={Building2}>
              <div className="space-y-3 pt-1">
                {[
                  { label: 'Ativos', value: metrics.activeClients, total: metrics.totalClients, color: 'bg-emerald-500', icon: Users },
                  { label: 'Prospectos', value: metrics.prospectClients, total: metrics.totalClients, color: 'bg-amber-500', icon: Target },
                  { label: 'Inativos', value: metrics.inactiveClients, total: metrics.totalClients, color: 'bg-gray-400', icon: TrendingDown },
                  { label: 'Bloqueados', value: metrics.blockedClients, total: metrics.totalClients, color: 'bg-red-500', icon: EyeOff },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${item.color.replace('bg-', 'bg-')}/10`}>
                      <item.icon className={`w-3.5 h-3.5 ${item.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.label}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{item.value}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-700`}
                          style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* RECENT ACTIVITY */}
      {/* ============================================ */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 sm:p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded-lg bg-egen-navy/5 dark:bg-egen-yellow/10">
            <Activity className="w-4 h-4 text-egen-navy dark:text-egen-yellow" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Atividade Recente</h3>
        </div>
        {metrics.recentActivity.length > 0 ? (
          <div className="space-y-1">
            {metrics.recentActivity.map((activity, i) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
              >
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{activity.description}</p>
                  <p className="text-xs text-gray-400 truncate">{activity.entity}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatRelativeDate(activity.createdAt)}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">Nenhuma atividade recente</div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ACTION CARD (small CTA-style cards)
// ============================================
const ActionCard: React.FC<{ icon: React.ElementType; label: string; value: number; color: string; pulse?: boolean }> = ({
  icon: Icon, label, value, color, pulse,
}) => (
  <div className="relative bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4 backdrop-blur-sm hover:shadow-md transition-all duration-300 group">
    {pulse && (
      <span className="absolute top-2 right-2 flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${color}`} />
      </span>
    )}
    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110`}>
      <Icon className="w-4.5 h-4.5 text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
  </div>
);

// ============================================
// ACTIVITY ICON
// ============================================
const ActivityIcon: React.FC<{ type: string }> = ({ type }) => {
  const base = 'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0';
  switch (type) {
    case 'new_client':
      return <div className={`${base} bg-egen-navy/10`}><Building2 className="w-4 h-4 text-egen-navy" /></div>;
    case 'new_lead':
      return <div className={`${base} bg-blue-50 dark:bg-blue-500/10`}><UserPlus className="w-4 h-4 text-blue-500" /></div>;
    case 'lead_converted':
      return <div className={`${base} bg-emerald-50 dark:bg-emerald-500/10`}><TrendingUp className="w-4 h-4 text-emerald-500" /></div>;
    case 'proposal_created':
      return <div className={`${base} bg-amber-50 dark:bg-amber-500/10`}><FileText className="w-4 h-4 text-amber-500" /></div>;
    case 'proposal_approved':
      return <div className={`${base} bg-emerald-50 dark:bg-emerald-500/10`}><DollarSign className="w-4 h-4 text-emerald-500" /></div>;
    default:
      return <div className={`${base} bg-gray-100 dark:bg-white/5`}><Activity className="w-4 h-4 text-gray-400" /></div>;
  }
};

// ============================================
// EMPTY CHART PLACEHOLDER
// ============================================
const EmptyChart: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center text-gray-300 dark:text-gray-600">
      <Icon className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-xs">{text}</p>
    </div>
  </div>
);

// ============================================
// DASHBOARD SKELETON
// ============================================
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-5 animate-pulse">
    <div className={`${GRADIENT_BG} rounded-2xl p-7 h-28`} />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <SkeletonChart /><SkeletonChart />
    </div>
    <SkeletonChart h="h-48" />
  </div>
);

// ============================================
// CHART DATA BUILDER
// ============================================
function buildChartData(metrics: CRMDashboardMetrics) {
  // Client Status Pie
  const clientStatusPie = [
    { name: 'Ativos', value: metrics.activeClients },
    { name: 'Prospectos', value: metrics.prospectClients },
    { name: 'Inativos', value: metrics.inactiveClients },
    { name: 'Bloqueados', value: metrics.blockedClients },
  ].filter(d => d.value > 0);

  // Lead Pipeline Bar (horizontal)
  const pipelineOrder: LeadStatus[] = [
    'to_contact', 'potential_client', 'follow_up', 'in_proposal',
    'client_with_demand', 'client_no_demand', 'no_demand',
  ];
  const leadPipelineBar = pipelineOrder
    .map(status => ({
      name: LEAD_STATUS_LABELS[status],
      value: metrics.leadsByStatus[status] || 0,
    }))
    .filter(d => d.value > 0);

  // Proposal Status Pie
  const proposalStatusPie = Object.entries(metrics.proposalsByStatus)
    .filter(([_, v]) => v > 0)
    .map(([status, count]) => ({
      name: formatStatusLabel(status),
      value: count,
    }));

  // Trends
  const clientTrend = metrics.monthlyClientGrowth;
  const leadTrend = metrics.monthlyLeadGrowth;

  return { clientStatusPie, leadPipelineBar, proposalStatusPie, clientTrend, leadTrend };
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    approved: 'Aprovada',
    rejected: 'Rejeitada',
    expired: 'Expirada',
    negotiating: 'Negociação',
    closed: 'Fechada',
    cancelled: 'Cancelada',
    lost: 'Perdida',
    price_survey: 'Pesquisa',
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluída',
    open: 'Aberta',
    active: 'Ativa',
    inactive: 'Inativa',
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

function formatRelativeDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default Dashboard;
