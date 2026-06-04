import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

class DITScraper:
    def __init__(self, base_url="https://dit.sn"):
        self.base_url = base_url
        self.domain = urlparse(base_url).netloc
        self.visited_urls = set()
        # 🕵️‍♂️ On usurpe l'identité d'un vrai navigateur pour éviter d'être bloqué
        self.headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3"
        }

    def is_valid_internal_url(self, url):
        """Vérifie si le lien appartient bien au site du DIT et n'est pas un fichier."""
        parsed = urlparse(url)
        is_internal = parsed.netloc == self.domain or parsed.netloc == ""
        is_not_file = not any(url.lower().endswith(ext) for ext in ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.svg'])
        return is_internal and is_not_file

    def get_all_links(self, url):
        """Récupère tous les liens internes présents sur une page."""
        links = set()
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code != 200:
                return links

            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all('a', href=True):
                href = a_tag['href']
                full_url = urljoin(url, href)
                full_url = full_url.split('#')[0]

                if self.is_valid_internal_url(full_url):
                    links.add(full_url)
        except Exception as e:
            print(f"Erreur lors de l'extraction des liens sur {url} : {e}")
        return links

    def scrape_page_content(self, url):
        """Extrait le titre et le texte propre d'une page spécifique."""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            
            # Debug : Pour savoir si on se fait jeter par le serveur (ex: 403 Forbidden)
            if response.status_code != 200:
                print(f"Page ignorée, statut HTTP : {response.status_code} sur {url}")
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # Nettoyage de la page
            for element in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                element.decompose()

            title = soup.title.string.strip() if soup.title else "Page sans titre"
            text_blocks = soup.get_text(separator="\n")
            clean_lines = [line.strip() for line in text_blocks.splitlines() if line.strip()]
            clean_text = "\n".join(clean_lines)

            # Debug : Pour voir la taille du texte récupéré
            print(f"{title} ({len(clean_text)} caractères extraits)")

            return {
                "title": title,
                "url": url,
                "content": clean_text
            }
        except Exception as e:
            print(f"Erreur lors du scraping de {url} : {e}")
            return None

    def start_scraping_site(self, max_pages=25):
        """Explore le site de manière récursive et extrait la donnée."""
        to_visit = [self.base_url]
        scraped_data = []

        print(f"Début du scraping global du site : {self.base_url}")

        while to_visit and len(self.visited_urls) < max_pages:
            current_url = to_visit.pop(0)

            if current_url in self.visited_urls:
                continue

            print(f"Scraping en cours : {current_url}")
            self.visited_urls.add(current_url)

            page_data = self.scrape_page_content(current_url)
            # On baisse la sécurité à 10 caractères pour voir si du contenu remonte
            if page_data and len(page_data["content"]) > 10: 
                scraped_data.append(page_data)

            new_links = self.get_all_links(current_url)
            for link in new_links:
                if link not in self.visited_urls and link not in to_visit:
                    to_visit.append(link)

        print(f"Scraping terminé. {len(scraped_data)} pages récupérées.")
        return scraped_data