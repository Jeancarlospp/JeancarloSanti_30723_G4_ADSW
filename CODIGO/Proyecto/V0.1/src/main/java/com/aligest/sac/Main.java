package com.aligest.sac;

import com.aligest.sac.datos.entidades.CodigoVerificacion;
import com.aligest.sac.datos.entidades.Copropietario;
import com.aligest.sac.datos.entidades.EstadoCuenta;
import com.aligest.sac.datos.entidades.Usuario;
import com.aligest.sac.datos.repositorios.RepositorioCodigoVerificacion;
import com.aligest.sac.datos.repositorios.RepositorioCopropietario;
import com.aligest.sac.datos.repositorios.RepositorioEstadoCuenta;
import com.aligest.sac.datos.repositorios.RepositorioUsuario;
import com.aligest.sac.negocio.adapter.AdaptadorExcelCopropietario;
import com.aligest.sac.negocio.adapter.FilaExcelCopropietario;
import com.aligest.sac.negocio.adapter.IFuenteCopropietario;
import com.aligest.sac.negocio.decorator.AuditoriaCopropietarioDecorator;
import com.aligest.sac.negocio.decorator.IServicioCopropietario;
import com.aligest.sac.negocio.decorator.ServicioCopropietarioBase;
import com.aligest.sac.negocio.decorator.ValidacionCopropietarioDecorator;
import com.aligest.sac.negocio.servicios.ServicioAutenticacion;
import com.aligest.sac.negocio.servicios.ServicioPerfil;
import com.aligest.sac.negocio.servicios.ServicioRecuperacionContrasena;
import com.aligest.sac.negocio.servicios.ServicioReportes;
import com.aligest.sac.presentacion.controladores.AccesoController;
import com.aligest.sac.presentacion.controladores.CopropietarioController;
import com.aligest.sac.presentacion.controladores.PerfilController;
import com.aligest.sac.presentacion.controladores.ReporteController;
import java.util.ArrayList;
import java.util.List;

public class Main {

	public static void main(String[] args) {
		boolean forzarConsola = false;
		for (String arg : args) {
			if ("--console".equals(arg)) {
				forzarConsola = true;
				break;
			}
		}

		// 1. Inicializando repositorios (Capa de Datos)
		RepositorioUsuario repoUsuario = new RepositorioUsuario();
		RepositorioCodigoVerificacion repoCodigoVerificacion = new RepositorioCodigoVerificacion();
		RepositorioCopropietario repoCopropietario = new RepositorioCopropietario();
		RepositorioEstadoCuenta repoEstadoCuenta = new RepositorioEstadoCuenta();
		sembrarDatosIniciales(repoUsuario, repoCopropietario, repoEstadoCuenta);

		// 2. Inicializando servicios (Capa de Negocio)
		ServicioAutenticacion servicioAuth = new ServicioAutenticacion(repoUsuario);
		ServicioRecuperacionContrasena servicioRecup = new ServicioRecuperacionContrasena(repoUsuario, repoCodigoVerificacion);
		ServicioPerfil servicioPerfil = new ServicioPerfil(repoUsuario);
		IServicioCopropietario servicioBase = new ServicioCopropietarioBase(repoCopropietario);
		IServicioCopropietario servicioConValidacion = new ValidacionCopropietarioDecorator(servicioBase, repoEstadoCuenta);
		IServicioCopropietario servicioCompleto = new AuditoriaCopropietarioDecorator(servicioConValidacion, "Sistema");
		ServicioReportes servicioReportes = new ServicioReportes(repoCopropietario, repoEstadoCuenta);

		// 3. Inicializando controladores (Capa de Presentación)
		AccesoController accesoCtrl = new AccesoController(servicioAuth, servicioRecup, repoUsuario);
		PerfilController perfilCtrl = new PerfilController(servicioPerfil);
		CopropietarioController coproCtrl = new CopropietarioController(servicioCompleto, repoCopropietario, repoEstadoCuenta, repoUsuario);
		ReporteController reporteCtrl = new ReporteController(servicioReportes);

		if (forzarConsola || java.awt.GraphicsEnvironment.isHeadless()) {
			separador("ALIGEST SAC - Sistema de Administración de Condominios");
			System.out.println("✔ Repositorios instanciados correctamente.");
			System.out.println("✔ Servicios instanciados correctamente.");
			System.out.println("✔ Controladores instanciados correctamente.");
			ejecutarSimulacionConsola(accesoCtrl, perfilCtrl, coproCtrl, reporteCtrl, repoUsuario, repoCodigoVerificacion, repoCopropietario, repoEstadoCuenta, servicioRecup);
		} else {
			javax.swing.SwingUtilities.invokeLater(() -> {
				new com.aligest.sac.presentacion.vistas.VistaPrincipalGui(
						accesoCtrl, perfilCtrl, coproCtrl, reporteCtrl,
						repoUsuario, repoCopropietario, repoEstadoCuenta, repoCodigoVerificacion
				).setVisible(true);
			});
		}
	}

	private static void ejecutarSimulacionConsola(AccesoController accesoCtrl,
												  PerfilController perfilCtrl,
												  CopropietarioController coproCtrl,
												  ReporteController reporteCtrl,
												  RepositorioUsuario repoUsuario,
												  RepositorioCodigoVerificacion repoCodigoVerificacion,
												  RepositorioCopropietario repoCopropietario,
												  RepositorioEstadoCuenta repoEstadoCuenta,
												  ServicioRecuperacionContrasena servicioRecup) {
		separador("4. Módulo: Administrar Sistema");
		System.out.println("\n--- REQ001: Iniciar Sesión ---");
		System.out.println(accesoCtrl.iniciarSesion("admin@aligest.com", "Admin123!"));
		System.out.println(accesoCtrl.iniciarSesion("admin@aligest.com", "claveErronea"));

		System.out.println("\n--- REQ002: Recuperar Contraseña ---");
		System.out.println(accesoCtrl.solicitarRecuperacion("admin@aligest.com"));
		Usuario usuarioAdmin = repoUsuario.buscarPorCorreo("admin@aligest.com");
		CodigoVerificacion codigo = servicioRecup.generarCodigoVerificacion(usuarioAdmin);
		servicioRecup.enviarCodigoPorCorreo(usuarioAdmin, codigo);
		System.out.println(accesoCtrl.validarCodigoYActualizarContrasena(
				"admin@aligest.com", codigo.getCodigo(), "NuevaClaveSegura!1"));

		System.out.println("\n--- REQ003: Configurar Perfiles ---");
		System.out.println(perfilCtrl.cambiarPerfil(2, "COPROPIETARIO"));

		separador("5. REQ004 - Importar Copropietarios (Patrón Adapter)");
		List<FilaExcelCopropietario> filasExcel = new ArrayList<>();
		filasExcel.add(new FilaExcelCopropietario("1712345679", "Torres Vega Lucia", "lucia.torres@email.com", "0961122334", "Casa-03"));
		filasExcel.add(new FilaExcelCopropietario("1756789012", "Sanchez Ruiz Elena", "elena.sanchez@email.com", "0955566677", "Casa-04"));
		List<IFuenteCopropietario> fuentesAdaptadas = new ArrayList<>();
		for (FilaExcelCopropietario fila : filasExcel) {
			fuentesAdaptadas.add(new AdaptadorExcelCopropietario(fila));
		}
		imprimirLineas("Resultado de importación", coproCtrl.importarDesdeExcel(fuentesAdaptadas));

		separador("6. REQ005 - Consultar Copropietarios (Patrón Strategy - Búsqueda)");
		imprimirCopropietarios("Búsqueda por Casa", coproCtrl.consultarCopropietarios("CASA", "Casa-01"));
		imprimirCopropietarios("Búsqueda por Nombre", coproCtrl.consultarCopropietarios("NOMBRE", "García"));
		imprimirCopropietarios("Búsqueda por Estado de Cuenta", coproCtrl.consultarCopropietarios("ESTADO", "PENDIENTE"));
		imprimirCopropietarios("Búsqueda por Perfil", coproCtrl.consultarCopropietarios("PERFIL", "COPROPIETARIO"));

		separador("7. REQ006 - Generar Reportes (Patrón Strategy - Reportes)");
		imprimirLineas("Reporte de Pagos", reporteCtrl.generarReporte("PAGOS", "2026-05", "ADMINISTRADOR"));
		imprimirLineas("Reporte de Morosidad", reporteCtrl.generarReporte("MOROSIDAD", "2026-05", "ADMINISTRADOR"));
		imprimirLineas("Reporte de Estado de Cuenta", reporteCtrl.generarReporte("ESTADO_CUENTA", "2026-05", "COPROPIETARIO"));

		separador("8. REQ007 - Modificar Copropietario (Patrón Decorator)");
		Copropietario copropietarioModificado = new Copropietario();
		copropietarioModificado.setId(1);
		copropietarioModificado.setCedula("1712345678");
		copropietarioModificado.setNombre("García López Ana María");
		copropietarioModificado.setCorreo("ana.garcia.nuevo@email.com");
		copropietarioModificado.setTelefono("0991234999");
		copropietarioModificado.setNumeroCasa("Casa-01");
		System.out.println(coproCtrl.modificarCopropietario(copropietarioModificado));

		separador("9. REQ008 - Eliminar Copropietario (Patrón Decorator)");
		System.out.println("Intentando eliminar copropietario CON historial financiero (id=1):");
		System.out.println(coproCtrl.eliminarCopropietario(1));
		System.out.println("\nIntentando eliminar copropietario SIN historial financiero (id=99):");
		System.out.println(coproCtrl.eliminarCopropietario(99));

		separador("SISTEMA ALIGEST SAC - Ejecución completada");
		System.out.println("Patrones verificados:");
		System.out.println("  ✔ Adapter   → FilaExcelCopropietario → IFuenteCopropietario (REQ004)");
		System.out.println("  ✔ Strategy  → Búsqueda dinámica por 4 criterios          (REQ005)");
		System.out.println("  ✔ Strategy  → Generación de 3 tipos de reporte           (REQ006)");
		System.out.println("  ✔ Decorator → Validación + Auditoría sobre CRUD base     (REQ004/007/008)");
		System.out.println("Arquitectura de 3 capas:");
		System.out.println("  ✔ Presentación → Controladores → Servicios → Repositorios");
		separador("FIN");
	}

        private static void sembrarDatosIniciales(RepositorioUsuario repoUsuario,
                                                                                          RepositorioCopropietario repoCopropietario,
                                                                                          RepositorioEstadoCuenta repoEstadoCuenta) {
                Usuario admin = new Usuario();
                admin.setNombre("Administrador Principal");
                admin.setCorreo("admin@aligest.com");
                admin.setContrasenaHash("Admin123!");
                admin.setRol("ADMINISTRADOR");
                admin.setEstado("ACTIVO");
                repoUsuario.guardar(admin);

                Usuario usuarioCopropietario = new Usuario();
                usuarioCopropietario.setNombre("Ana García");
                usuarioCopropietario.setCorreo("ana.garcia@email.com");
                usuarioCopropietario.setContrasenaHash("Copro123!");
                usuarioCopropietario.setRol("COPROPIETARIO");
                usuarioCopropietario.setEstado("ACTIVO");
                repoUsuario.guardar(usuarioCopropietario);

                Copropietario copropietarioUno = new Copropietario();
                copropietarioUno.setCedula("1712345678");
                copropietarioUno.setNombre("García López Ana María");
                copropietarioUno.setCorreo("ana.garcia@email.com");
                copropietarioUno.setTelefono("0991234567");
                copropietarioUno.setNumeroCasa("Casa-01");
                copropietarioUno.setUsuarioId(usuarioCopropietario.getId());
                repoCopropietario.guardar(copropietarioUno);

                Copropietario copropietarioDos = new Copropietario();
                copropietarioDos.setCedula("1798765432");
                copropietarioDos.setNombre("Pérez Morales Carlos");
                copropietarioDos.setCorreo("carlos.perez@email.com");
                copropietarioDos.setTelefono("0987654321");
                copropietarioDos.setNumeroCasa("Casa-02");
                repoCopropietario.guardar(copropietarioDos);

                EstadoCuenta estadoCuenta = new EstadoCuenta();
                estadoCuenta.setCopropietarioId(copropietarioUno.getId());
                estadoCuenta.setPeriodo("2026-05");
                estadoCuenta.setMontoBase(100.0);
                estadoCuenta.setRecargoMora(15.0);
                estadoCuenta.setSaldoPendiente(115.0);
                estadoCuenta.setEstado("PENDIENTE");
                repoEstadoCuenta.guardar(estadoCuenta);

                EstadoCuenta estadoCuentaPagado = new EstadoCuenta();
                estadoCuentaPagado.setCopropietarioId(copropietarioDos.getId());
                estadoCuentaPagado.setPeriodo("2026-05");
                estadoCuentaPagado.setMontoBase(100.0);
                estadoCuentaPagado.setRecargoMora(0.0);
                estadoCuentaPagado.setSaldoPendiente(0.0);
                estadoCuentaPagado.setEstado("PAGADO");
                repoEstadoCuenta.guardar(estadoCuentaPagado);
        }

        private static void imprimirLineas(String titulo, List<String> lineas) {
                System.out.println("\n--- " + titulo + " ---");
                for (String linea : lineas) {
                        System.out.println(linea);
                }
        }

        private static void imprimirCopropietarios(String titulo, List<Copropietario> copropietarios) {
                System.out.println("\n--- " + titulo + " ---");
                if (copropietarios.isEmpty()) {
                        System.out.println("No se encontraron resultados.");
                        return;
                }
                for (Copropietario copropietario : copropietarios) {
                        System.out.println(copropietario);
                }
        }

        private static void separador(String titulo) {
                System.out.println("\n" + "=".repeat(65));
                System.out.println("  " + titulo);
                System.out.println("=".repeat(65));
        }
}