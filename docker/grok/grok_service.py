#!/usr/bin/env python3
"""
UrbanLink Grok AI Service
Provides AI-powered features for the UrbanLink platform
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
import redis
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/grok_service.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GrokService:
    def __init__(self):
        self.api_key = os.getenv('GROK_API_KEY')
        self.base_url = os.getenv('GROK_BASE_URL', 'https://api.x.ai/v1')
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', 6379))

        if not self.api_key:
            raise ValueError("GROK_API_KEY environment variable is required")

        # Initialize Redis for caching
        self.redis = redis.Redis(
            host=self.redis_host,
            port=self.redis_port,
            decode_responses=True
        )

        # Test Redis connection
        try:
            self.redis.ping()
            logger.info("Connected to Redis")
        except redis.ConnectionError:
            logger.warning("Redis connection failed, continuing without cache")

    def generate_response(self, prompt: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a response from Grok AI"""
        if options is None:
            options = {}

        # Create cache key
        cache_key = f"grok_response:{hash(prompt + json.dumps(options, sort_keys=True))}"

        # Check cache first
        cached_response = self.redis.get(cache_key)
        if cached_response:
            logger.info("Returning cached response")
            return json.loads(cached_response)

        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "model": options.get("model", "grok-1"),
            "stream": False,
            "temperature": options.get("temperature", 0.7),
            "max_tokens": options.get("max_tokens", 1000),
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30
                )

                if response.status_code == 200:
                    data = response.json()

                    # Cache the response for 1 hour
                    self.redis.setex(cache_key, 3600, json.dumps(data))

                    return data
                else:
                    logger.warning(f"Grok API error (attempt {attempt + 1}): {response.status_code} - {response.text}")

                    if response.status_code == 429:  # Rate limited
                        import time
                        time.sleep(2 ** attempt)  # Exponential backoff

            except Exception as e:
                logger.error(f"Grok API request failed (attempt {attempt + 1}): {str(e)}")

        raise Exception(f"Grok API request failed after {max_retries} attempts")

    def analyze_ride_data(self, ride_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze ride data and provide insights"""
        prompt = f"""Analyze the following ride data and provide insights about patterns, optimization opportunities, and recommendations:

{json.dumps(ride_data, indent=2)}

Please provide:
1. Demand patterns analysis
2. Route optimization suggestions
3. Pricing recommendations
4. Driver allocation insights
5. Customer satisfaction improvements"""

        response = self.generate_response(prompt, {
            "temperature": 0.3,
            "max_tokens": 1500
        })

        return {
            "analysis": response["choices"][0]["message"]["content"],
            "ride_data": ride_data,
            "timestamp": datetime.utcnow().isoformat(),
            "model": "grok-1"
        }

    def suggest_pricing(self, ride_details: Dict[str, Any]) -> Dict[str, Any]:
        """Generate smart pricing suggestions"""
        prompt = f"""Based on the following ride details, suggest optimal pricing considering distance, time, demand, and market conditions:

{json.dumps(ride_details, indent=2)}

Consider:
- Distance and duration
- Time of day and day of week
- Current demand levels
- Competitor pricing
- Driver earnings
- Customer affordability

Provide specific pricing suggestions with detailed reasoning."""

        response = self.generate_response(prompt, {
            "temperature": 0.2,
            "max_tokens": 800
        })

        return {
            "suggestions": response["choices"][0]["message"]["content"],
            "ride_details": ride_details,
            "generated_at": datetime.utcnow().isoformat()
        }

    def generate_support_response(self, customer_query: str, context: Dict[str, Any] = None) -> str:
        """Generate customer support responses"""
        if context is None:
            context = {}

        context_str = f"\n\nContext: {json.dumps(context)}" if context else ""

        prompt = f"""You are a helpful customer support agent for UrbanLink, a ride-sharing and government services platform in Kenya.

Customer Query: {customer_query}{context_str}

Provide a clear, concise, and helpful response that:
1. Acknowledges the customer's concern
2. Provides accurate information
3. Offers practical solutions
4. Maintains a professional and friendly tone
5. Includes next steps if applicable"""

        response = self.generate_response(prompt, {
            "temperature": 0.7,
            "max_tokens": 500
        })

        return response["choices"][0]["message"]["content"]

    def analyze_driver_performance(self, driver_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze driver performance"""
        prompt = f"""Analyze this driver's performance data and provide insights, recommendations for improvement, and performance metrics:

{json.dumps(driver_data, indent=2)}

Please evaluate:
1. Overall performance rating
2. Strengths and areas for improvement
3. Customer satisfaction metrics
4. Efficiency and reliability
5. Safety record
6. Specific recommendations for improvement"""

        response = self.generate_response(prompt, {
            "temperature": 0.3,
            "max_tokens": 1200
        })

        return {
            "analysis": response["choices"][0]["message"]["content"],
            "driver_data": driver_data,
            "analyzed_at": datetime.utcnow().isoformat()
        }

    def predict_demand(self, historical_data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict demand patterns"""
        prompt = f"""Based on this historical ride data, predict demand patterns for the next 24 hours and provide recommendations for driver allocation:

{json.dumps(historical_data, indent=2)}

Please provide:
1. Demand forecast for the next 24 hours
2. Peak hours identification
3. High-demand areas
4. Driver allocation recommendations
5. Surge pricing suggestions"""

        response = self.generate_response(prompt, {
            "temperature": 0.2,
            "max_tokens": 1000
        })

        return {
            "predictions": response["choices"][0]["message"]["content"],
            "historical_data": historical_data,
            "predicted_at": datetime.utcnow().isoformat()
        }

# Flask application
app = Flask(__name__)
CORS(app)

grok_service = None

def get_grok_service():
    global grok_service
    if grok_service is None:
        try:
            grok_service = GrokService()
        except Exception as e:
            logger.error(f"Failed to initialize Grok service: {e}")
            return None
    return grok_service

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    service = get_grok_service()
    if service:
        return jsonify({
            "status": "healthy",
            "service": "Grok AI",
            "timestamp": datetime.utcnow().isoformat()
        })
    else:
        return jsonify({
            "status": "unhealthy",
            "error": "Grok service not available"
        }), 503

@app.route('/analyze-ride', methods=['POST'])
def analyze_ride():
    """Analyze ride data"""
    service = get_grok_service()
    if not service:
        return jsonify({"error": "Grok service not available"}), 503

    try:
        data = request.get_json()
        result = service.analyze_ride_data(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error analyzing ride data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/suggest-pricing', methods=['POST'])
def suggest_pricing():
    """Generate pricing suggestions"""
    service = get_grok_service()
    if not service:
        return jsonify({"error": "Grok service not available"}), 503

    try:
        data = request.get_json()
        result = service.suggest_pricing(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error generating pricing suggestions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/support-response', methods=['POST'])
def support_response():
    """Generate customer support response"""
    service = get_grok_service()
    if not service:
        return jsonify({"error": "Grok service not available"}), 503

    try:
        data = request.get_json()
        query = data.get('query', '')
        context = data.get('context', {})

        response = service.generate_support_response(query, context)
        return jsonify({
            "response": response,
            "query": query,
            "context": context,
            "generated_at": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logger.error(f"Error generating support response: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-driver', methods=['POST'])
def analyze_driver():
    """Analyze driver performance"""
    service = get_grok_service()
    if not service:
        return jsonify({"error": "Grok service not available"}), 503

    try:
        data = request.get_json()
        result = service.analyze_driver_performance(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error analyzing driver performance: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/predict-demand', methods=['POST'])
def predict_demand():
    """Predict demand patterns"""
    service = get_grok_service()
    if not service:
        return jsonify({"error": "Grok service not available"}), 503

    try:
        data = request.get_json()
        result = service.predict_demand(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error predicting demand: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    """General chat endpoint"""
    service = get_grok_service()
    if not service:
        return jsonify({"error": "Grok service not available"}), 503

    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        options = data.get('options', {})

        result = service.generate_response(prompt, options)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting UrbanLink Grok AI Service")
    app.run(host='0.0.0.0', port=5000, debug=False)