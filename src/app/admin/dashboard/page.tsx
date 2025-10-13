"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChartHorizontal,
  Filter,
  PieChart,
  RefreshCcw,
  User,
  Activity,
  CheckSquare,
  AlertCircle,
  Calendar,
  CalendarCheck,
  BarChart3,
  Shield,
  AlertTriangle,
} from "lucide-react";

// Adicionando estilos para animações
import "./dashboard.css";
import { LoadingSpinner } from "@/components/LoadingPersonalizado";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { dashboardService } from "@/api/services/dashboardService";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// Define interface for dashboard data
interface DashboardData {
  cards: {
    os_abertas_total: number;
    os_encerradas_total: number;
    os_abertas_mes: number;
    os_encerradas_mes: number;
    os_abertas_hoje: number;
    os_encerradas_hoje: number;
    os_aberto_total: number;
    os_aberto_garantia: number;
    os_aberto_pendentes: number;
  };
  graficos: {
    motivos_atendimento: {
      descricao: string;
      quantidade: number;
    }[];
    por_tecnico: {
      nome: string;
      quantidade: number;
    }[];
    top_clientes: {
      cliente: string;
      quantidade: number;
    }[];
  };
}

// Period options for filtering
const periodOptions = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "60", label: "Últimos 60 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "mes", label: "Este mês" },
  { value: "ano", label: "Este ano" },
  { value: "sempre", label: "Sempre" },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // Valor padrão conforme API
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Handle refresh with useCallback para evitar re-renderizações desnecessárias
  const handleRefresh = useCallback(() => {
    // Força uma atualização dos dados sem mudar o período
    setIsRefreshing(true);
    const currentPeriod = selectedPeriod;
    setSelectedPeriod("");
    setTimeout(() => setSelectedPeriod(currentPeriod), 10);
  }, [selectedPeriod]);

  // Color palettes - Usando as cores padrão do projeto
  const chartColors = useMemo(
    () => [
      "#7B54BE", // Roxo principal
      "#FDAD15", // Amarelo/Laranja
      "#75f9bd", // Verde claro
      "#abc7e0", // Azul claro
      "#9B74DE", // Variação do roxo
      "#FFC045", // Variação do amarelo
      "#95FFD1", // Variação do verde
      "#CBE7FF", // Variação do azul
      "#6B44AE", // Roxo escuro
      "#ED9D05", // Laranja escuro
      "#55D99D", // Verde mais escuro
      "#8BA7C0", // Azul mais escuro
      "#AC95E4", // Variação clara do roxo
      "#FFDB75", // Variação clara do amarelo
      "#B5FFDD", // Variação clara do verde
      "#DBE7F0", // Variação clara do azul
      "#5A39A7", // Roxo mais escuro
      "#D38B04", // Laranja mais escuro
      "#45B983", // Verde mais escuro
      "#6B87A0", // Azul mais escuro
    ],
    []
  );

  // Fetch dashboard data based on selected period
  useEffect(() => {
    // Não faz nada se o período estiver vazio (usado no refresh)
    if (!selectedPeriod) return;

    const fetchData = async () => {
      setIsLoading(true);
      setIsRefreshing(true);
      setError(null);

      try {
        const params: Record<string, string> = {
          periodo: selectedPeriod,
        };

        const response = await dashboardService.getGestorData(params);

        console.log("Dashboard API response:", response);

        // Dados já vêm formatados corretamente da API
        const transformedData: DashboardData = {
          cards: {
            os_abertas_total: response.cards.os_abertas_total || 0,
            os_encerradas_total: response.cards.os_encerradas_total || 0,
            os_abertas_mes: response.cards.os_abertas_mes || 0,
            os_encerradas_mes: response.cards.os_encerradas_mes || 0,
            os_abertas_hoje: response.cards.os_abertas_hoje || 0,
            os_encerradas_hoje: response.cards.os_encerradas_hoje || 0,
            os_aberto_total: response.cards.os_aberto_total || 0,
            os_aberto_garantia: response.cards.os_aberto_garantia || 0,
            os_aberto_pendentes: response.cards.os_aberto_pendentes || 0,
          },
          graficos: {
            motivos_atendimento: response.graficos.motivos_atendimento || [],
            por_tecnico: response.graficos.por_tecnico || [],
            top_clientes: response.graficos.top_clientes || [],
          },
        };

        setDashboardData(transformedData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          "Não foi possível carregar os dados do dashboard. Tente novamente mais tarde."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // Prepare chart data usando useMemo para evitar re-cálculos desnecessários
  const pieChartData = useMemo(
    () => ({
      labels:
        dashboardData?.graficos.motivos_atendimento.map(
          (item) => item.descricao
        ) || [],
      datasets: [
        {
          data:
            dashboardData?.graficos.motivos_atendimento.map(
              (item) => item.quantidade
            ) || [],
          backgroundColor: chartColors.slice(
            0,
            dashboardData?.graficos.motivos_atendimento.length || 0
          ),
          borderWidth: 1,
          borderRadius: 3,
          hoverOffset: 10,
        },
      ],
    }),
    [dashboardData?.graficos.motivos_atendimento, chartColors]
  );

  const verticalBarChartData = useMemo(
    () => ({
      labels:
        dashboardData?.graficos.por_tecnico.map((item) => item.nome) || [],
      datasets: [
        {
          label: "Ordens de Serviço",
          data:
            dashboardData?.graficos.por_tecnico.map(
              (item) => item.quantidade
            ) || [],
          backgroundColor: "#7B54BE", // Roxo principal
          borderColor: "#6642B0",
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: "#9B74DE",
        },
      ],
    }),
    [dashboardData?.graficos.por_tecnico]
  );

  const horizontalBarChartData = useMemo(
    () => ({
      labels:
        dashboardData?.graficos.top_clientes
          .slice(0, 20)
          .map((item) => item.cliente) || [],
      datasets: [
        {
          label: "OSs Abertas",
          data:
            dashboardData?.graficos.top_clientes
              .slice(0, 20)
              .map((item) => item.quantidade) || [],
          backgroundColor: "#abc7e0", // Azul claro
          borderColor: "#8BA7C0",
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: "#CBE7FF",
        },
      ],
    }),
    [dashboardData?.graficos.top_clientes]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 10,
          font: {
            size: 11,
          },
          color: "#555",
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#333",
        bodyColor: "#555",
        titleFont: {
          weight: "bold" as const,
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 6,
        displayColors: true,
      },
    },
  };

  const horizontalChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      title: {
        display: true,
        text: "Top 20 Clientes com OSs Abertas",
        font: {
          size: 14,
          weight: "bold" as const,
          family: "'Inter', sans-serif",
        },
        color: "#333",
        padding: 10,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#333",
        bodyColor: "#555",
        titleFont: {
          weight: "bold" as const,
          size: 13,
        },
        bodyFont: {
          size: 12,
        },
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 6,
        displayColors: true,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#666",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      y: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          font: {
            size: 11,
          },
          color: "#666",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Card data with icons and colors - Usando as cores padrão do projeto e ícones Lucide
  const cards = [
    {
      title: "Total de OSs Abertas",
      value: dashboardData?.cards.os_abertas_total || 0,
      icon: <AlertTriangle size={20} strokeWidth={1.5} />,
      color: "#7B54BE", // Roxo principal
      bgColor: "#F0EBFF",
    },
    {
      title: "Total de OSs Encerradas",
      value: dashboardData?.cards.os_encerradas_total || 0,
      icon: <CheckSquare size={20} strokeWidth={1.5} />,
      color: "#75f9bd", // Verde
      bgColor: "#E6FFF2",
    },
    {
      title: "OSs Abertas no Mês",
      value: dashboardData?.cards.os_abertas_mes || 0,
      icon: <Calendar size={20} strokeWidth={1.5} />,
      color: "#7B54BE", // Roxo principal
      bgColor: "#F0EBFF",
    },
    {
      title: "OSs Encerradas no Mês",
      value: dashboardData?.cards.os_encerradas_mes || 0,
      icon: <CalendarCheck size={20} strokeWidth={1.5} />,
      color: "#75f9bd", // Verde
      bgColor: "#E6FFF2",
    },
    {
      title: "OSs Abertas no Dia",
      value: dashboardData?.cards.os_abertas_hoje || 0,
      icon: <Activity size={20} strokeWidth={1.5} />,
      color: "#7B54BE", // Roxo principal
      bgColor: "#F0EBFF",
    },
    {
      title: "OSs Encerradas no Dia",
      value: dashboardData?.cards.os_encerradas_hoje || 0,
      icon: <CheckSquare size={20} strokeWidth={1.5} />,
      color: "#75f9bd", // Verde
      bgColor: "#E6FFF2",
    },
    {
      title: "Total de OSs em Aberto",
      value: dashboardData?.cards.os_aberto_total || 0,
      icon: <BarChart3 size={20} strokeWidth={1.5} />,
      color: "#abc7e0", // Azul
      bgColor: "#E6F0F9",
    },
    {
      title: "OSs em Aberto em Garantia",
      value: dashboardData?.cards.os_aberto_garantia || 0,
      icon: <Shield size={20} strokeWidth={1.5} />,
      color: "#FDAD15", // Amarelo/Laranja
      bgColor: "#FFF6E6",
    },
    {
      title: "OSs Pendentes Agora",
      value: dashboardData?.cards.os_aberto_pendentes || 0,
      icon: <AlertCircle size={20} strokeWidth={1.5} />,
      color: "#FDAD15", // Amarelo/Laranja
      bgColor: "#FFF6E6",
    },
  ];

  return (
    <div className="px-2 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header with period selector */}
      <div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-sm animate-slideIn"
        style={{ borderLeft: "3px solid #7B54BE" }}
      >
        <div className="animate-fadeIn" style={{ animationDelay: "100ms" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#7B54BE] flex items-center gap-2">
            <span className="bg-[#F0EBFF] p-1.5 rounded-md inline-block">
              <BarChart3
                size={22}
                strokeWidth={1.5}
                className="text-[#7B54BE]"
              />
            </span>
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Visão geral dos indicadores operacionais
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-end md:self-auto w-full sm:w-auto">
          <div
            className="flex items-center gap-2 w-full sm:w-auto animate-fadeIn"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative w-full sm:w-auto flex items-center">
              <div className="absolute left-2 pointer-events-none text-[#7B54BE]">
                <Filter size={16} strokeWidth={1.5} />
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none border-0 bg-[#F0EBFF] text-[#7B54BE] rounded-md pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B54BE] w-full sm:w-auto transition-all duration-300 focus-ring"
              >
                {periodOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="text-gray-800"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-0 inset-y-0 flex items-center px-2 text-[#7B54BE]">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`focus-ring flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 animate-scaleIn ${
              isRefreshing
                ? "bg-[#F0EBFF] text-[#7B54BE] opacity-70 cursor-not-allowed"
                : "bg-[#7B54BE] text-white hover:opacity-90"
            } w-full sm:w-auto`}
            aria-label="Atualizar dados"
          >
            <RefreshCcw
              size={15}
              strokeWidth={1.5}
              className={`${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>{isRefreshing ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20">
          <LoadingSpinner
            size="large"
            text="Carregando indicadores"
            color="primary"
            showText={true}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-white border-l-3 border-l-red-500 rounded-xl p-5 text-gray-700 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-red-50 p-2 animate-pulse">
              <AlertCircle
                size={20}
                strokeWidth={1.5}
                className="text-red-500"
              />
            </div>
            <p className="font-medium animate-slideIn">{error}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 ml-0 sm:ml-9">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 focus-ring ${
                isRefreshing
                  ? "bg-red-50 text-red-400"
                  : "bg-red-500 text-white hover:bg-red-600 hover:shadow"
              }`}
            >
              {isRefreshing ? "Tentando novamente..." : "Tentar novamente"}
            </button>
            <button
              onClick={() => setError(null)}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 transition-all duration-300 focus-ring"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!isLoading && !error && dashboardData && (
        <>
          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
            {cards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn flex flex-col"
                style={{
                  borderLeft: `3px solid ${card.color}`,
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-700 text-xs sm:text-sm font-medium whitespace-normal line-clamp-2 flex-1">
                    {card.title}
                  </p>
                  <div
                    className="p-1.5 rounded-md flex-shrink-0"
                    style={{ backgroundColor: card.bgColor, color: card.color }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div className="mt-auto pt-2">
                  <p
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ color: card.color }}
                  >
                    {card.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {/* Pie Chart - Distribuição de OSs por Motivo */}
            <div
              className="bg-white p-4 rounded-xl shadow-sm h-[350px] sm:h-[400px] hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn card-delay-1"
              style={{ borderLeft: "3px solid #7B54BE" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm sm:text-base text-gray-800 animate-slideIn"
                  style={{ animationDelay: "100ms" }}
                >
                  OSs por Motivo de Atendimento
                </h3>
                <div className="p-1.5 rounded-md bg-[#F0EBFF]">
                  <PieChart
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#7B54BE]"
                  />
                </div>
              </div>
              <div
                className="h-[270px] sm:h-[320px] flex items-center justify-center animate-scaleIn"
                style={{ animationDelay: "200ms" }}
              >
                {dashboardData.graficos.motivos_atendimento.length > 0 ? (
                  <Pie data={pieChartData} options={chartOptions} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="p-4 rounded-full bg-gray-100">
                      <PieChart
                        size={30}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 text-center text-sm mt-3">
                      Não há dados suficientes para este gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart - OSs por Técnico */}
            <div
              className="bg-white p-4 rounded-xl shadow-sm h-[350px] sm:h-[400px] hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] animate-fadeIn card-delay-2"
              style={{ borderLeft: "3px solid #75f9bd" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm sm:text-base text-gray-800 animate-slideIn"
                  style={{ animationDelay: "150ms" }}
                >
                  OSs por Técnico
                </h3>
                <div className="p-1.5 rounded-md bg-[#E6FFF2]">
                  <User
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#75f9bd]"
                  />
                </div>
              </div>
              <div
                className="h-[270px] sm:h-[320px] flex items-center justify-center animate-scaleIn"
                style={{ animationDelay: "250ms" }}
              >
                {dashboardData.graficos.por_tecnico.length > 0 ? (
                  <Bar data={verticalBarChartData} options={chartOptions} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="p-4 rounded-full bg-gray-100">
                      <User
                        size={30}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 text-center text-sm mt-3">
                      Não há dados suficientes para este gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Bar Chart - Top 20 Clientes */}
            <div
              className="bg-white p-4 rounded-xl shadow-sm h-[350px] sm:h-[400px] hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] md:col-span-2 lg:col-span-1 animate-fadeIn card-delay-3"
              style={{ borderLeft: "3px solid #abc7e0" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-sm sm:text-base text-gray-800 animate-slideIn"
                  style={{ animationDelay: "200ms" }}
                >
                  Top 20 Clientes com OSs
                </h3>
                <div className="p-1.5 rounded-md bg-[#E6F0F9]">
                  <BarChartHorizontal
                    size={18}
                    strokeWidth={1.5}
                    className="text-[#abc7e0]"
                  />
                </div>
              </div>
              <div
                className="h-[270px] sm:h-[320px] flex items-center justify-center animate-scaleIn"
                style={{ animationDelay: "300ms" }}
              >
                {dashboardData.graficos.top_clientes.length > 0 ? (
                  <Bar
                    data={horizontalBarChartData}
                    options={horizontalChartOptions}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <div className="p-4 rounded-full bg-gray-100">
                      <BarChartHorizontal
                        size={30}
                        strokeWidth={1.5}
                        className="text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 text-center text-sm mt-3">
                      Não há dados suficientes para este gráfico
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
