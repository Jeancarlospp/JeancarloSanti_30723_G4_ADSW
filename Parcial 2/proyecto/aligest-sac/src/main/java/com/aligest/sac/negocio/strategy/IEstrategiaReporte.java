package com.aligest.sac.negocio.strategy;

import java.util.List;

public interface IEstrategiaReporte {
    List<String> generar(String filtro, List<?> datos);
}