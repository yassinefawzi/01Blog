package com.blog01.dto.request;

import com.blog01.entity.MediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostRequest {

    @NotBlank
    @Size(max = 5000)
    private String description;

    private String mediaUrl;
    private MediaType mediaType = MediaType.NONE;
}
