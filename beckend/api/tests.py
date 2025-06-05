from rest_framework.test import APITestCase
from django.urls import reverse
from .models import Agent


class AgentAPITests(APITestCase):
    def test_create_agent(self):
        url = reverse('agents')
        data = {
            'name': 'Test Agent',
            'description': 'desc',
            'prompt': 'Hello'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Agent.objects.count(), 1)
        agent = Agent.objects.first()
        self.assertEqual(agent.name, 'Test Agent')

