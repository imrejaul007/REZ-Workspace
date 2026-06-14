"""
RTMN Python SDK
Unified API for all RTMN products
"""

import requests
from typing import Optional, Dict, Any


class RTMNResponse:
    """RTMN API Response"""
    def __init__(self, data: Dict[str, Any], meta: Optional[Dict[str, Any]] = None):
        self.data = data
        self.meta = meta or {}


class RTMNClient:
    """RTMN Unified Client"""

    def __init__(self, api_key: str, base_url: str = "http://localhost:3000", timeout: int = 30):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

        # Initialize modules
        self.hojai = HojaiModule(self)
        self.rabtul = RabtulModule(self)
        self.corpperks = CorpPerksModule(self)
        self.adbazaar = AdBazaarModule(self)
        self.safeqr = SafeQRModule(self)
        self.nexha = NexhaModule(self)

    def _request(self, method: str, path: str, data: Optional[Dict] = None) -> RTMNResponse:
        """Make API request"""
        url = f"{self.base_url}{path}"
        response = self.session.request(method, url, json=data, timeout=self.timeout)
        response.raise_for_status()
        return RTMNResponse(**response.json())

    def health(self) -> RTMNResponse:
        """Health check"""
        return self._request('GET', '/health')


class BaseModule:
    """Base module class"""
    def __init__(self, client: RTMNClient):
        self.client = client

    def _post(self, path: str, data: Dict) -> RTMNResponse:
        return self.client._request('POST', path, data)

    def _get(self, path: str, params: Optional[Dict] = None) -> RTMNResponse:
        url = path
        if params:
            query = '&'.join([f"{k}={v}" for k, v in params.items() if v])
            url = f"{path}?{query}" if query else path
        return self.client._request('GET', url)


class HojaiModule(BaseModule):
    """HOJAI AI Module"""

    def chat(self, message: str, context: Optional[Dict] = None) -> RTMNResponse:
        """Chat with AI"""
        return self._post('/api/v1/hojai/chat', {'message': message, 'context': context})

    def execute_agent(self, agent_id: str, task: str, context: Optional[Dict] = None) -> RTMNResponse:
        """Execute AI agent"""
        return self._post(f'/api/v1/hojai/agent/{agent_id}', {'task': task, 'context': context})

    def search(self, query: str, limit: int = 10) -> RTMNResponse:
        """Search knowledge base"""
        return self._post('/api/v1/hojai/search', {'query': query, 'limit': limit})

    def list_agents(self, industry: Optional[str] = None) -> RTMNResponse:
        """List available agents"""
        return self._get('/api/v1/hojai/agents', {'industry': industry})


class RabtulModule(BaseModule):
    """RABTUL Payments Module"""

    def create_payment(self, amount: int, order_id: str, **kwargs) -> RTMNResponse:
        """Create payment"""
        return self._post('/api/v1/rabtul/payments', {
            'amount': amount,
            'orderId': order_id,
            **kwargs
        })

    def get_payment(self, payment_id: str) -> RTMNResponse:
        """Get payment status"""
        return self._get(f'/api/v1/rabtul/payments/{payment_id}')

    def create_wallet(self, user_id: str, name: str, email: str, phone: Optional[str] = None) -> RTMNResponse:
        """Create wallet"""
        return self._post('/api/v1/rabtul/wallet', {
            'userId': user_id,
            'name': name,
            'email': email,
            'phone': phone
        })

    def get_wallet_balance(self, wallet_id: str) -> RTMNResponse:
        """Get wallet balance"""
        return self._get(f'/api/v1/rabtul/wallet/{wallet_id}')

    def top_up_wallet(self, wallet_id: str, amount: int, source: str = 'upi') -> RTMNResponse:
        """Top up wallet"""
        return self._post(f'/api/v1/rabtul/wallet/{wallet_id}/topup', {
            'amount': amount,
            'source': source
        })

    def create_bnpl_order(self, amount: int, customer_id: str, tenure: int = 3) -> RTMNResponse:
        """Create BNPL order"""
        return self._post('/api/v1/rabtul/bnpl/order', {
            'amount': amount,
            'customerId': customer_id,
            'tenure': tenure
        })


class CorpPerksModule(BaseModule):
    """CorpPerks HRMS Module"""

    def create_employee(self, name: str, email: str, phone: Optional[str] = None,
                      department: Optional[str] = None, role: Optional[str] = None,
                      join_date: Optional[str] = None, salary: Optional[int] = None) -> RTMNResponse:
        """Create employee (auto-creates wallet, SafeQR, Nexha)"""
        data = {'name': name, 'email': email}
        if phone: data['phone'] = phone
        if department: data['department'] = department
        if role: data['role'] = role
        if join_date: data['joinDate'] = join_date
        if salary: data['salary'] = salary
        return self._post('/api/v1/corpperks/employees', data)

    def get_employee(self, employee_id: str) -> RTMNResponse:
        """Get employee"""
        return self._get(f'/api/v1/corpperks/employees/{employee_id}')

    def list_employees(self, department: Optional[str] = None,
                       status: Optional[str] = None, page: int = 1, limit: int = 50) -> RTMNResponse:
        """List employees"""
        return self._get('/api/v1/corpperks/employees', {
            'department': department,
            'status': status,
            'page': page,
            'limit': limit
        })

    def run_payroll(self, month: int, year: int, employees: Optional[list] = None) -> RTMNResponse:
        """Run payroll"""
        return self._post('/api/v1/corpperks/payroll/run', {
            'month': month,
            'year': year,
            'employees': employees
        })


class AdBazaarModule(BaseModule):
    """AdBazaar Marketing Module"""

    def create_campaign(self, name: str, campaign_type: str, budget: int,
                       target: Optional[str] = None, start_date: Optional[str] = None,
                       end_date: Optional[str] = None, platforms: Optional[list] = None) -> RTMNResponse:
        """Create campaign"""
        data = {'name': name, 'type': campaign_type, 'budget': budget}
        if target: data['target'] = target
        if start_date: data['startDate'] = start_date
        if end_date: data['endDate'] = end_date
        if platforms: data['platforms'] = platforms
        return self._post('/api/v1/adbazaar/campaigns', data)

    def get_campaign(self, campaign_id: str) -> RTMNResponse:
        """Get campaign"""
        return self._get(f'/api/v1/adbazaar/campaigns/{campaign_id}')

    def get_campaign_analytics(self, campaign_id: str,
                             start_date: Optional[str] = None, end_date: Optional[str] = None) -> RTMNResponse:
        """Get campaign analytics"""
        return self._get(f'/api/v1/adbazaar/campaigns/{campaign_id}/analytics', {
            'startDate': start_date,
            'endDate': end_date
        })

    def find_influencers(self, category: Optional[str] = None,
                        followers: Optional[str] = None, location: Optional[str] = None) -> RTMNResponse:
        """Find influencers"""
        return self._get('/api/v1/adbazaar/influencers', {
            'category': category,
            'followers': followers,
            'location': location
        })


class SafeQRModule(BaseModule):
    """SafeQR Module"""

    def generate_qr(self, qr_type: str, entity_id: str, metadata: Optional[Dict] = None) -> RTMNResponse:
        """Generate QR code"""
        return self._post('/api/v1/safeqr/qr/generate', {
            'type': qr_type,
            'entityId': entity_id,
            'metadata': metadata
        })

    def verify_qr(self, qr_code: str) -> RTMNResponse:
        """Verify QR code (awards loyalty points!)"""
        return self._post('/api/v1/safeqr/qr/verify', {'qrCode': qr_code})

    def register_warranty(self, qr_code: str, product_id: str,
                         purchase_date: str, warranty_months: int = 12) -> RTMNResponse:
        """Register warranty"""
        return self._post('/api/v1/safeqr/warranty/register', {
            'qrCode': qr_code,
            'productId': product_id,
            'purchaseDate': purchase_date,
            'warrantyMonths': warranty_months
        })

    def trigger_alert(self, alert_type: str, latitude: Optional[float] = None,
                     longitude: Optional[float] = None) -> RTMNResponse:
        """Trigger safety alert"""
        location = {'latitude': latitude, 'longitude': longitude} if latitude and longitude else None
        return self._post('/api/v1/safeqr/safety/alert', {
            'type': alert_type,
            'location': location
        })


class NexhaModule(BaseModule):
    """Nexha Identity Module"""

    def create_entity(self, entity_type: str, name: str,
                     email: Optional[str] = None, phone: Optional[str] = None,
                     metadata: Optional[Dict] = None) -> RTMNResponse:
        """Create entity"""
        data = {'type': entity_type, 'name': name}
        if email: data['email'] = email
        if phone: data['phone'] = phone
        if metadata: data['metadata'] = metadata
        return self._post('/api/v1/nexha/entities', data)

    def get_entity(self, entity_id: str) -> RTMNResponse:
        """Get entity"""
        return self._get(f'/api/v1/nexha/entities/{entity_id}')

    def link_entities(self, entity_id: str, target_id: str,
                     relationship: str, metadata: Optional[Dict] = None) -> RTMNResponse:
        """Link entities"""
        return self._post(f'/api/v1/nexha/entities/{entity_id}/link', {
            'targetId': target_id,
            'relationship': relationship,
            'metadata': metadata
        })

    def get_trust_score(self, entity_id: str) -> RTMNResponse:
        """Get trust score"""
        return self._get(f'/api/v1/nexha/trust/{entity_id}')

    def search_entities(self, query: str, entity_type: Optional[str] = None,
                       limit: int = 20) -> RTMNResponse:
        """Search entities"""
        return self._post('/api/v1/nexha/search', {
            'query': query,
            'type': entity_type,
            'limit': limit
        })
