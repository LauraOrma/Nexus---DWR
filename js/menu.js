const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');

menuToggle.addEventListener('click', () => {
	menuToggle.classList.toggle('active');
	menu.classList.toggle('active');

	// Actualizar aria-expanded para accesibilidad
	const isExpanded = menuToggle.classList.contains('active');
	menuToggle.setAttribute('aria-expanded', isExpanded);
	menuToggle.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
});

// Cerrar menú al hacer click en un enlace
document.querySelectorAll('.menu-nav a').forEach(link => {
	link.addEventListener('click', () => {
		menuToggle.classList.remove('active');
		menu.classList.remove('active');
		menuToggle.setAttribute('aria-expanded', 'false');
		menuToggle.setAttribute('aria-label', 'Abrir menú');
	});
});
