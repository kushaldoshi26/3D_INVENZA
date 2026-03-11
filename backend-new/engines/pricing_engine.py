from typing import Dict, Any
import math

class PricingEngine:
    def __init__(self):
        # Base rates (INR)
        self.material_rates = {
            'PLA': 12,      # ₹12/gram
            'ABS': 14,      # ₹14/gram  
            'PETG': 16,     # ₹16/gram
            'TPU': 25,      # ₹25/gram
            'Resin': 45     # ₹45/gram (dental grade)
        }
        
        self.machine_rates = {
            'FDM': 30,      # ₹30/hour
            'SLA': 80       # ₹80/hour (resin)
        }
        
        # Service tiers
        self.service_multipliers = {
            'individual': 1.0,
            'business': 0.9,     # 10% discount
            'dental': 2.5,       # Premium pricing
            'enterprise': 0.8    # 20% discount
        }
    
    def calculate_printing_price(self, analysis: Dict, material: str = 'PLA', 
                               tier: str = 'individual') -> Dict[str, Any]:
        """Calculate 3D printing price"""
        
        # Get material weight
        weight_key = f'weight_{material.lower()}_g'
        weight_g = analysis.get(weight_key, analysis.get('volume_cm3', 0) * 1.24)
        
        # Material cost
        material_cost = weight_g * self.material_rates.get(material, 12)
        
        # Machine cost
        print_hours = analysis.get('print_time_hours', 1)
        machine_type = 'SLA' if material == 'Resin' else 'FDM'
        machine_cost = print_hours * self.machine_rates[machine_type]
        
        # Service fee (complexity based)
        complexity = analysis.get('complexity_score', 5)
        base_service_fee = 50 + (complexity * 10)
        
        # Calculate subtotal
        subtotal = material_cost + machine_cost + base_service_fee
        
        # Apply tier multiplier
        multiplier = self.service_multipliers.get(tier, 1.0)
        total = subtotal * multiplier
        
        # Minimum price
        min_price = 99 if tier == 'individual' else 150
        final_price = max(min_price, total)
        
        return {
            'material': material,
            'weight_grams': round(weight_g, 2),
            'material_cost': round(material_cost, 2),
            'machine_cost': round(machine_cost, 2),
            'service_fee': round(base_service_fee, 2),
            'tier_multiplier': multiplier,
            'subtotal': round(subtotal, 2),
            'final_price': round(final_price, 2),
            'currency': 'INR'
        }
    
    def calculate_gift_price(self, gift_type: str, customization_level: str = 'basic') -> Dict[str, Any]:
        """Calculate custom gift pricing (value-based)"""
        
        base_prices = {
            'keychain': {'basic': 299, 'premium': 499},
            'phone_case': {'basic': 799, 'premium': 1299},
            'photo_frame': {'basic': 899, 'premium': 1599},
            'lithophane_lamp': {'basic': 1499, 'premium': 2999},
            'mini_trophy': {'basic': 699, 'premium': 1199},
            'desk_organizer': {'basic': 1299, 'premium': 2199}
        }
        
        price = base_prices.get(gift_type, {}).get(customization_level, 599)
        
        return {
            'gift_type': gift_type,
            'customization_level': customization_level,
            'price': price,
            'includes': ['Design', 'Printing', 'Basic Packaging'],
            'currency': 'INR'
        }
    
    def calculate_dental_price(self, case_type: str, analysis: Dict) -> Dict[str, Any]:
        """Calculate dental service pricing (premium)"""
        
        base_prices = {
            'study_model': 1500,
            'crown_model': 2500,
            'bridge_model': 3500,
            'surgical_guide': 4500,
            'full_arch': 5500
        }
        
        base_price = base_prices.get(case_type, 2000)
        
        # Complexity adjustment
        complexity = analysis.get('complexity_score', 5)
        complexity_multiplier = 1 + (complexity - 5) * 0.1
        
        # Volume adjustment (larger models cost more)
        volume_cm3 = analysis.get('volume_cm3', 10)
        volume_multiplier = 1 + max(0, (volume_cm3 - 10) * 0.05)
        
        final_price = base_price * complexity_multiplier * volume_multiplier
        
        return {
            'case_type': case_type,
            'base_price': base_price,
            'complexity_multiplier': round(complexity_multiplier, 2),
            'volume_multiplier': round(volume_multiplier, 2),
            'final_price': round(final_price, 2),
            'material': 'Resin',
            'includes': ['Scan Validation', 'Professional Review', 'Quality Guarantee'],
            'currency': 'INR',
            'note': 'Final approval required by licensed dentist'
        }
    
    def calculate_modeling_price(self, service_type: str, complexity: str = 'medium') -> Dict[str, Any]:
        """Calculate 3D modeling service pricing"""
        
        hourly_rates = {
            'basic_modeling': 500,      # ₹500/hour
            'parametric_design': 800,   # ₹800/hour
            'reverse_engineering': 1200, # ₹1200/hour
            'cad_conversion': 600       # ₹600/hour
        }
        
        time_estimates = {
            'simple': 2,    # 2 hours
            'medium': 5,    # 5 hours
            'complex': 12   # 12 hours
        }
        
        hourly_rate = hourly_rates.get(service_type, 600)
        estimated_hours = time_estimates.get(complexity, 5)
        
        total_price = hourly_rate * estimated_hours
        
        return {
            'service_type': service_type,
            'complexity': complexity,
            'hourly_rate': hourly_rate,
            'estimated_hours': estimated_hours,
            'total_price': total_price,
            'currency': 'INR'
        }
    
    def get_bulk_discount(self, quantity: int, base_price: float) -> Dict[str, Any]:
        """Calculate bulk order discounts"""
        
        if quantity >= 100:
            discount = 0.25  # 25% off
        elif quantity >= 50:
            discount = 0.20  # 20% off
        elif quantity >= 20:
            discount = 0.15  # 15% off
        elif quantity >= 10:
            discount = 0.10  # 10% off
        else:
            discount = 0.0
        
        discounted_price = base_price * (1 - discount)
        total_savings = (base_price - discounted_price) * quantity
        
        return {
            'quantity': quantity,
            'discount_percentage': discount * 100,
            'original_price': base_price,
            'discounted_price': round(discounted_price, 2),
            'total_savings': round(total_savings, 2),
            'total_amount': round(discounted_price * quantity, 2)
        }

# Global pricing engine instance
pricing_engine = PricingEngine()