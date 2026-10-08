package com.grandhotel.hotel.controller;

import com.grandhotel.hotel.dto.Requests;
import com.grandhotel.hotel.model.Models;
import com.grandhotel.hotel.service.HotelService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final HotelService hotel;
    public ApiController(HotelService hotel) { this.hotel = hotel; }

    @PostMapping("/auth/login") public Map<String, Object> login(@RequestBody Requests.Login request) { return hotel.login(request); }
    @PostMapping("/auth/signup") public Map<String, Object> signup(@RequestBody Requests.SignUp request) { return hotel.signUp(request); }
    @GetMapping("/dashboard") public Map<String, Object> dashboard() { return hotel.dashboard(); }
    @GetMapping("/rooms") public List<Models.Room> rooms() { return hotel.getRooms(); }
    @PostMapping("/rooms") public Models.Room addRoom(@RequestBody Requests.Room request) { return hotel.createRoom(request); }
    @GetMapping("/bookings") public List<Models.Booking> bookings() { return hotel.getBookings(); }
    @PostMapping("/bookings") public Models.Booking createBooking(@RequestBody Requests.Booking request) { return hotel.createBooking(request); }
    @GetMapping("/bookings/{id}") public Models.Booking booking(@PathVariable String id) { return hotel.getBooking(id); }
    @GetMapping("/customers") public List<Models.Customer> customers() { return hotel.getCustomers(); }
    @GetMapping("/food") public List<Models.FoodItem> food() { return hotel.getFood(); }
    @PostMapping("/food") public Models.FoodItem addFood(@RequestBody Map<String, Object> request) { return hotel.createFood(request); }
    @GetMapping("/food/orders") public List<Models.FoodOrder> foodOrders() { return hotel.getFoodOrders(); }
    @PostMapping("/food/orders") public Models.FoodOrder foodOrder(@RequestBody Requests.FoodOrder request) { return hotel.addFoodOrder(request); }
    @PatchMapping("/food/orders/{orderId}/items/{foodId}") public Models.FoodOrder quantity(@PathVariable String orderId, @PathVariable String foodId, @RequestBody Requests.Quantity request) { return hotel.updateFoodQuantity(orderId, foodId, request.quantity()); }
    @DeleteMapping("/food/orders/{orderId}") public Map<String, String> deleteOrder(@PathVariable String orderId) { hotel.deleteFoodOrder(orderId); return Map.of("message", "Food order removed."); }
    @PostMapping("/bookings/{id}/check-in") public Models.Booking checkIn(@PathVariable String id) { return hotel.checkIn(id); }
    @PostMapping("/bookings/{id}/check-out") public Models.Invoice checkOut(@PathVariable String id, @RequestBody(required = false) Requests.Checkout request) { return hotel.checkOut(id, request); }
    @GetMapping("/bookings/{id}/invoice") public Models.Invoice invoice(@PathVariable String id) { return hotel.getInvoice(id); }
}
